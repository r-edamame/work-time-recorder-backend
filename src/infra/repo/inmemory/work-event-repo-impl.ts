import { DailyActivity } from '@domain/model/daily-activity';
import { WorkEvent } from '@domain/model/work-event';
import { WorkEventRepo } from '@domain/repo/work-event-repo';
import { removeWithIndicies } from '@util/array';
import { Dayjs } from 'dayjs';

type RawWorkEvent = WorkEvent & { workerId: string };

const toWorkEvent = (r: RawWorkEvent): WorkEvent => {
  return {
    command: r.command,
    timestamp: r.timestamp,
  };
};

export class InMemoryWorkEventRepo implements WorkEventRepo {
  private workEvents: RawWorkEvent[];

  constructor() {
    this.workEvents = [];
  }

  async getDailyActivity(workerId: string, date: Dayjs): Promise<DailyActivity> {
    const events = this.workEvents
      .filter((e) => {
        return e.workerId === workerId && e.timestamp.isSame(date, 'day');
      })
      .sort((a, b) => {
        return a.timestamp.diff(b.timestamp);
      });

    const [activity, error] = DailyActivity.fromEvents(events.map(toWorkEvent));

    if (error) {
      throw new Error();
    }
    return activity;
  }

  async saveDailyActivity(workerId: string, activity: DailyActivity): Promise<true> {
    const events = activity.getEvents();

    if (events.length <= 0) return true;

    const date = events[0].timestamp;

    const stored = this.workEvents
      .map((e, ix): [RawWorkEvent, number] => [e, ix])
      .filter(([e, ix]) => {
        return e.workerId === workerId && e.timestamp.isSame(date, 'day');
      });

    const same = (a: WorkEvent, b: WorkEvent): boolean => a.command === b.command && a.timestamp.isSame(b.timestamp);

    const unsavedEvents = events.filter((e) => {
      return stored.find(([d, ix]) => same(e, d)) === undefined;
    });
    const lostEvents = stored.filter(([e, ix]) => {
      return events.find((d) => same(e, d)) === undefined;
    });

    this.workEvents = removeWithIndicies(
      this.workEvents,
      lostEvents.map(([e, ix]) => ix),
    );
    this.workEvents.push(
      ...unsavedEvents.map((e) => {
        return { ...e, workerId };
      }),
    );

    return true;
  }
}
