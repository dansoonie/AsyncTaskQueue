# AsyncTaskQueue

A queue for handling concurrent tasks asynchronously in an orderly fashion.
Use this if you have many tasks to do but want to handle them only at a certain level of concurrency at any time.

## Constructor
```
const taskQueue = new AsyncTaskQueue({
  concurrency: 5, // max number of tasks to handle concurrently
  pureQueue: true, // events firing task result is in the order the task was enqueued
  taskHandler: (task: any): Promise<any> => {
    // Your task handling code...
  }
});
```

## Enqueue Task
```
const task = {
  // Your task definition for your task handler
}
taskQueue.enqueueTask(task);
```

## Start and Pause
```
// Will continue to handle tasks concurrently if room for concurrency
task.start();

// Will pause to handle tasks concurrently even when there is room for concurrency.
// Currently running tasks will complete/fail
task.pause(); 
```

## Events
The following events will be emitted by the AsyncTaskQueue with the specified arguments.

### AsyncTaskQueueEvent.START
Emitted when a task is being handled
task: any - The task
canStartTask: boolean - There is still room for concurrency

### AsyncTaskQueueEvent.COMPLETE
Emitted when a task has completed
Listen to this event for obtaining task result.
When prueQueue option is true, the task results will be in the order they were enqueued.
Otherwise, 
result: TaskResult - Result of the successfully completed task {
  task: // The task definition you enqueued,
  result: // The result resolved by your task handler
  error: null,
  startTime: // Date object indicating the time when the task was being handled
  endTime: // Date object indicating when the task was completed
}

### AsyncTaskQueueEvent.FAIL
Emitted when a task has completed.
Listen to this event for obtaining task result.
result: TaskResult - Result of the failed task {
  task: // The task definition you enqueued,
  result: null,
  error: // The error which caused the rejection to your task handler
  startTime: // Date object indicating the time when the task was being handled
  endTime: // Date object indicating when the task was failed
}

### AsyncTaskQueueEvent.DONE
Emitted when a task has been handled.
Listen to this event to keep track of concurrency.
task: any - the task definition you enqueued
canStartTask: boolean - There is still room for concurrency