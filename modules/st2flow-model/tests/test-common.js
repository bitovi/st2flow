import chai, { expect } from 'chai';
import chaiSubset from 'chai-subset';
chai.use(chaiSubset);

import { tasks as testTasks, transitions as testTransitions, mistral, orquesta } from './data/common-data';

/**
 * These tests cover common aspects between models. Effort should be taken
 * to not duplicate these tests.
 */
describe('st2flow-model: Common Model Tests: ', () => {
  [ mistral, orquesta ].forEach(({ Model, versionMatch, yaml }) => {
    let model = null;

    describe(`${Model.name}`, () => {
      beforeEach(() => {
        model = new Model(yaml);
        expect(model).to.have.property('tokenSet');
      });

      it('serializes yaml to original form', () => {
        expect(model.toYAML()).to.equal(yaml);
      });

      it('reads metadata', () => {
        expect(model).to.have.property('version', versionMatch);
        expect(model).to.have.property('name', 'Common Name');
        expect(model).to.have.property('description', 'Common Description');
      });

      it('reads tasks', () => {
        const tasks = model.tasks;
        expect(Object.keys(tasks)).to.have.property('length', testTasks.length);

        for (const task of tasks) {
          expect(task).to.containSubset(testTasks.find(t => t.name === task.name));
        }
      });

      it('reads transitions', () => {
        const transitions = model.transitions;
        expect(transitions).to.have.property('length', testTransitions.length);

        for (const transition of transitions) {
          expect(transition).to.containSubset(
            testTransitions.find(tr =>
              tr.from.name === transition.from.name && tr.to.name === transition.to.name && tr.condition === transition.condition
            )
          );
        }
      });

      describe('addTask()', () => {
        it('adds a new task', () => {
          const origLength = model.tasks.length;

          model.addTask({
            name: 'foo',
            action: 'bar',
          });

          expect(model.tasks).to.have.property('length', origLength + 1);
        });
      });

      describe('addTransition()', () => {
        it('adds a new transition', () => {
          const origLength = model.transitions.length;

          model.addTransition({
            from: { name: model.tasks[0].name },
            to: { name: model.tasks[1].name },
          });

          expect(model.transitions).to.have.property('length', origLength + 1);
        });
      });

      describe('updateTask()', () => {
        it('updates tasks', () => {
          model.updateTask(model.tasks[0], {
            name: 'foo',
            action: 'bar',
          });

          const task = model.tasks[0];
          const testData = testTasks[0];
          expect(task).to.have.property('name', 'foo');
          expect(task).to.have.property('action', 'bar');
          expect(task).to.have.nested.property('coords.x', testData.coords.x);
          expect(task).to.have.nested.property('coords.y', testData.coords.y);
          expect(model.toYAML()).to.equal(yaml
            .replace(`${testData.name}:`, 'foo:')
            .replace(`action: ${testData.action}`, 'action: bar')
          );
        });
      });

      describe('updateTransition()', () => {
        it('updates conditions', () => {
          model.updateTransition(model.transitions[0], {
            condition: 'bar',
          });

          const transition = model.transitions[0];
          const testData = testTransitions[0];
          expect(transition).to.have.nested.property('from.name', testData.from.name);
          expect(transition).to.have.nested.property('to.name', testData.to.name);
          expect(transition).to.have.property('condition', 'bar');
        });

        it('removes conditions', () => {
          model.updateTransition(model.transitions[1], {
            condition: null,
          });

          const transition = model.transitions[1];
          expect(transition).to.have.property('condition', null);
        });

        it('updates destination when the "to" property changes', () => {
          model.updateTransition(model.transitions[2], {
            to: { name: 't4' },
          });

          const transition = model.transitions[2];
          expect(transition).to.have.nested.property('to.name', 't4');
        });

        it('moves a transition when the "from" property changes', () => {
          const startLength = model.transitions.length;
          const originalTr = model.transitions[1];

          model.updateTransition(originalTr, {
            from: { name: 't2' },
          });

          expect(model.transitions.length).to.equal(startLength);
          const oldTransition = model.transitions.find(tr =>
            tr.from.name === originalTr.from.name && tr.to.name === originalTr.to.name && tr.condition === originalTr.condition
          );
          const newTransition = model.transitions.find(tr =>
            tr.from.name === 't2' && tr.to.name === originalTr.to.name && tr.condition === originalTr.condition
          );

          expect(oldTransition).to.equal(undefined);
          expect(newTransition).to.not.equal(undefined);
        });
      });

      describe('deleteTask()', () => {
        it('deletes tasks', () => {
          const firstTask = model.tasks[0];
          expect(model.tasks).to.have.property('length', 4);
          model.deleteTask(firstTask);
          expect(model.tasks).to.have.property('length', 3);

          const newInstance = new Model(model.toYAML());
          expect(newInstance.tasks).to.have.property('length', 3);
        });
      });

      describe('deleteTransition()', () => {
        it('deletes transitions', () => {
          expect(model.transitions).to.have.property('length', 4);
          model.deleteTransition(model.transitions[0]);
          expect(model.transitions).to.have.property('length', 3);

          const newInstance = new Model(model.toYAML());
          expect(newInstance.transitions).to.have.property('length', 3);
        });
      });
    });
  });
});
