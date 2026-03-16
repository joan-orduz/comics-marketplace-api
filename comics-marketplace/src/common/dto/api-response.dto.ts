export class ApiResponseDto<T> {
  success: boolean;
  data: T;
  timestamp: string;

  constructor(data: T, success = true) {
    this.success = success;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}
