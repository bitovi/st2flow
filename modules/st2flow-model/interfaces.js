// @flow

export type TransitionType = 'Success' | 'Error' | 'Complete'

export interface CanvasPoint {
    x: number;
    y: number
}

export interface TaskInterface {
    name: string;
    action: string;
    coords: CanvasPoint;

    input?: Object;

    // Mistral Only
    publish?: string | Array<Object>;
}

export interface TaskRefInterface {
    name: string;
    workflow?: string;
}

export interface TransitionInterface {
    from: TaskRefInterface;
    to: TaskRefInterface;
    condition: ?string;

    // Mistral Only
    type?: TransitionType;

    // Orquesta Only
    publish?: string | Array<Object>;
}

export interface ModelInterface {
    +version: number;
    +description: string;
    +tasks: Array<TaskInterface>;
    +transitions: Array<TransitionInterface>;

    // These intentionally return void to prevent chaining
    // Consumers are responsible for cleaning up after themselves
    on(event: string, callback: Function): void;
    removeListener(event: string, callback: Function): void;

    constructor(yaml: string): void;
    fromYAML(yaml: string): void;
    toYAML(): string;

    addTask(opts: TaskInterface): void;
    updateTask(oldTask: TaskInterface, newData: TaskInterface): void;
    deleteTask(task: TaskInterface): void;

    addTransition(opts: TransitionInterface): void;
    updateTransition(oldTransition: TransitionInterface, newData: TransitionInterface): void;
    deleteTransition(transition: TransitionInterface): void;
}

export interface EditorPoint {
    row: number;
    column: number;
}

export interface DeltaInterface {
    start: EditorPoint;
    end: EditorPoint;
    action: 'insert' | 'remove';
    lines: Array<string>;
}

export type AjvError = {
  dataPath: string,
  keyword: string,
  message: string,
  params: Object,
}

export type GenericError = Error | {
  message: string
}
