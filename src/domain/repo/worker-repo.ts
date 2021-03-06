import { Worker } from '@domain/model/worker';

export interface WorkerRepo {
  getWorkerById(id: string): Promise<Worker>;
  listWorkers(): Promise<Worker[]>;
  saveWorker(worker: Worker): Promise<true>;
}
