import { TaskService } from './task.service';

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  findAll() {
    return this.taskService.handleCron();
  }
}
