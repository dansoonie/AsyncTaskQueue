import { AsyncTaskQueueEvent } from '../dist';
import { AsyncTaskQueue } from '../dist/index';

const queue = new AsyncTaskQueue({
  concurrency: 4,
  pureQueue: true,
  taskHandler: (task: any): Promise<number> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const random = Math.random();
        if (random > 0.5) return resolve(random);
        return reject(random);
      }, task.wait);
    });
  }
});

queue.on(AsyncTaskQueueEvent.TASK_START, (task, canStart) => {
  console.log("staring task", task.id, 'can start', canStart);
}).on(AsyncTaskQueueEvent.TASK_COMLETE, (taskResult) => {
  const task = taskResult.task;
  console.log("\tfinished-completed", task.id);
}).on(AsyncTaskQueueEvent.TASK_FAIL, (taskResult) => {
  const task = taskResult.task;
  console.log("\tfinished-failed", task.id);
}).on(AsyncTaskQueueEvent.TASK_DONE, (task, canStart) => {
  console.log("\t\tdone", task.id, 'can start', canStart);
})

let count = 0;
function taskGenerator() {
  const task = {
    id: count,
    wait: Math.random() * 5000
  };
  console.log('enqueue task', task);
  queue.enqueueTask(task);
  count++;
  if (count < 20) {
    setTimeout(taskGenerator, 500);
  }
}

taskGenerator();