import EventEmitter = require("events");

export type TaskHandler = (task: any) => Promise<any>;

export interface IAsyncTaskQueueOptions {
  concurrency?: number;
  pureQueue?: boolean;
  taskHandler: TaskHandler;
}

export enum AsyncTaskQueueEvent {
  TASK_START = 'task_start',
  TASK_COMLETE = 'task_complete',
  TASK_FAIL = 'task_fail',
  TASK_DONE = 'task_done'
}

export enum AsyncTaskQueueState {
  STARTED = 'started',
  PAUSED = 'paused',
}

export interface ITaskResult {
  readonly task: any;
  readonly result: any;
  readonly error: any;
  readonly startTime: Date;
  readonly endTime: Date;
}

class TaskResult {
  readonly task: any;
  readonly result: any;
  readonly error: any;
  readonly startTime: Date;
  readonly endTime: Date;

  constructor(task: any, result: any, error: any, startTime: Date) {
    this.task = task;
    this.result = result;
    this.error = error;
    this.startTime = startTime;
    this.endTime = new Date();
  }
}

export class AsyncTaskQueue extends EventEmitter {
  private concurrency: number;
  private pureQueue: boolean;
  private taskHandler: TaskHandler;

  private state: AsyncTaskQueueState = AsyncTaskQueueState.STARTED;  
  private taskQueue: Array<any> = [];
  private resultQueue: Array<Promise<any> | TaskResult>;
  private concurrentTasks: Array<any> = [];

  constructor(options: IAsyncTaskQueueOptions) {
    super();
    this.concurrency = options.concurrency | 4;
    this.pureQueue = options.pureQueue;
    this.taskHandler = options.taskHandler;
    if (this.pureQueue) {
      this.resultQueue = [];
    }
  }

  public start() {
    this.state = AsyncTaskQueueState.STARTED;
    this.dequeueTask();
  }

  public pause() {
    this.state = AsyncTaskQueueState.STARTED;
  }

  public enqueueTask(task: any) {
    this.taskQueue.push(task);
    this.dequeueTask();
  }

  private addConcurrentTask(task: any) {
    this.concurrentTasks.push(task);
  }

  private removeConcurrentTask(task: any) {
    const idx = this.concurrentTasks.indexOf(task);
    this.concurrentTasks.splice(idx, 1);
  }

  private async dequeueTask() {
    if (this.state === AsyncTaskQueueState.STARTED) {
      if (this.canStartTask() && this.taskQueue.length) {
        const task = this.taskQueue.shift();
        const startTime = new Date();
        const taskPromise = this.taskHandler(task).then(result => {
          this.handleFulfilledTaskPromise(taskPromise, new TaskResult(
            task,
            result,
            null,
            startTime
          ));
        }).catch(err => {
         this.handleFulfilledTaskPromise(taskPromise, new TaskResult(
           task,
           null,
           err,
           startTime,
          ));
        }).finally(() => {
          this.removeConcurrentTask(task);
          this.emit(AsyncTaskQueueEvent.TASK_DONE, task, this.canStartTask());
          this.dequeueTask();
        });
        this.resultQueue?.push(taskPromise);
        this.addConcurrentTask(task);
        this.emit(AsyncTaskQueueEvent.TASK_START, task, this.canStartTask());
      }
    }
  }

  private handleFulfilledTaskPromise(taskPromise: Promise<any>, taskResult: TaskResult) {
    if (this.pureQueue) {
      const idx = this.resultQueue.indexOf(taskPromise);
      this.resultQueue[idx] = taskResult;
      while (this.resultQueue[0] instanceof TaskResult) {
        this.emitDoneTaskResult(this.resultQueue.shift() as TaskResult);
      }
    } else {
      this.emitDoneTaskResult(taskResult);
    }
  }

  private emitDoneTaskResult(taskResult: TaskResult) {
    const event = taskResult.error
      ? AsyncTaskQueueEvent.TASK_FAIL
      : AsyncTaskQueueEvent.TASK_COMLETE
    this.emit(event, taskResult);
  }

  public canStartTask() {
    return this.getConcurrentTaskCount() < this.concurrency;
  }

  public getState() {
    return this.state;
  }

  public getConcurrency() {
    return this.concurrency;
  }

  public getConcurrentTaskCount() {
    return this.concurrentTasks.length;
  }
}