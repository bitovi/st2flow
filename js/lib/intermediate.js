'use strict';

let _ = require('lodash')
  , EventEmitter = require('events').EventEmitter
  , Range = require('./range.js')
  ;

class Intermediate extends EventEmitter {
  constructor() {
    super();

    this.tasks = [];
  }

  parse(code) {
    let lines = code.split('\n');

    let state = {
      isTaskBlock: false,
      taskBlockIdent: null,
      currentTask: null,
      untouchedTasks: _.pluck(this.tasks, 'name')
    };

    let spec = {
      WS_INDENT: /^(\s*)/,
      TASK_BLOCK: /^\s*chain:\s*$/,
      TASK: /^\s*-\s*/,
      TASK_NAME: /(.*name:\s+)([\w\s]+)/,
      TASK_SUCCESS_TRANSITION: /on-success:\s+([\w\s]+)/,
      TASK_ERROR_TRANSITION: /on-failure:\s+([\w\s]+)/
    };

    _.each(lines, (line, lineNum) => {

      let indent = line.match(spec.WS_INDENT)[0].length;

      // If it starts with `chain:`, that's a start of task block
      if (spec.TASK_BLOCK.test(line)) {
        state.isTaskBlock = true;
        state.taskBlockIdent = indent;
        return;
      }

      // If it has same or lesser indent, that's an end of task block
      if (state.isTaskBlock && state.taskBlockIdent >= indent) {
        state.isTaskBlock = false;
        return false;
      }

      if (state.isTaskBlock) {
        let match;

        // If it starts with `-`, that's a new task
        if (spec.TASK.test(line)) {
          if (state.currentTask) {
            state.currentTask.range.task.setEnd(lineNum, 0);
          }
          state.currentTask = {
            range: {
              task: new Range(lineNum, 0).setType('task')
            }
          };
        }

        // If it has `name:`, that's task name
        match = spec.TASK_NAME.exec(line);
        if (match) {
          let [,_prefix,name] = match
            , coords = [lineNum, _prefix.length, lineNum, _prefix.length + name.length]
            ;

          state.currentTask.range.name = new Range(...coords).setType('name');

          state.currentTask = this.task(name, state.currentTask);
          _.remove(state.untouchedTasks, (e) => e === name);
        }

        // If it has `on-success:`, that's successfil transition pointer
        match = spec.TASK_SUCCESS_TRANSITION.exec(line);
        if (match) {
          let [,success] = match;

          state.currentTask.success = success;
        }

        // If it has `on-failure:`, that's unsuccessfil transition pointer
        match = spec.TASK_ERROR_TRANSITION.exec(line);
        if (match) {
          let [,error] = match;

          state.currentTask.error = error;
        }

      }

    });

    // Close the range of the last task
    if (state.currentTask) {
      state.currentTask.range.task.setEnd(lines.length, 0);
    }

    // Delete all the tasks not updated during parsing
    _.each(state.untouchedTasks, (name) => _.remove(this.tasks, { name }));

    this.emit('parse', this.tasks);
  }

  task(name, pending) {
    let task = _.find(this.tasks, { name });

    if (!task) {
      task = { name };
      this.tasks.push(task);
    }

    _.assign(task, pending);

    return task;
  }

  search(startRow, startColumn, endRow=startRow, endColumn=startColumn) {
    let range = new Range(startRow, startColumn, endRow, endColumn);

    return _.find(this.tasks, (e) => {
      return e.range.task.intersects(range);
    });
  }
}

module.exports = Intermediate;
