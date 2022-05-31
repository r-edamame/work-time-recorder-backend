import { Either } from '@util/types';
import { availableCommands, nextStatus } from './work-command';
import { WorkEvent } from './work-event';
import { WorkStatus } from './work-status';
import dayjs from 'dayjs';

export class DailyActivity {
  private constructor(private daily: WorkEvent[]) {}

  private get firstEvent(): WorkEvent | undefined {
    return this.daily[0];
  }

  private get lastEvent(): WorkEvent | undefined {
    return this.daily[this.daily.length - 1];
  }

  getCurrentStatus(): WorkStatus {
    const lastEvent = this.lastEvent;
    if (lastEvent === undefined) return 'beforeWork';
    else return nextStatus(lastEvent.command);
  }
  get lastTimestamp(): dayjs.Dayjs | undefined {
    return this.firstEvent?.timestamp || undefined;
  }

  get startedAt(): dayjs.Dayjs | undefined {
    return this.firstEvent?.timestamp || undefined;
  }
  get finishedAt(): dayjs.Dayjs | undefined {
    return this.lastEvent?.timestamp || undefined;
  }

  addEvent(event: WorkEvent): Either<WorkStatus> {
    if (!availableCommands(this.getCurrentStatus()).includes(event.command)) {
      return [undefined, new Error('invalid command')];
    }
    if (this.lastTimestamp && !event.timestamp.isAfter(this.lastTimestamp)) {
      return [undefined, new Error('invalid timestamp')];
    }

    this.daily.push(event);
    return [this.getCurrentStatus(), undefined];
  }

  getEvents(): WorkEvent[] {
    return [...this.daily];
  }

  static fromEvents(events: WorkEvent[]): Either<DailyActivity> {
    const [status, error] = getCurrentStatus(events);
    if (error) {
      return [undefined, error];
    }

    return [new DailyActivity([...events]), undefined];
  }
}

const getCurrentStatus = (events: WorkEvent[]): Either<WorkStatus> => {
  const [firstEvent, ...remEvents] = events;
  if (firstEvent === undefined) {
    return ['beforeWork', undefined];
  }

  if (firstEvent.command !== 'startWork') {
    return [undefined, new Error('first command must be "startWork"')];
  }

  let status: WorkStatus = 'working';
  let lastTimestamp = firstEvent.timestamp;
  for (const event of remEvents) {
    if (!availableCommands(status).includes(event.command)) {
      return [undefined, new Error('invalid command')];
    }
    if (!event.timestamp.isAfter(lastTimestamp)) {
      return [undefined, new Error('invalid timestamp')];
    }

    lastTimestamp = event.timestamp;
    status = nextStatus(event.command);
  }

  return [status, undefined];
};
