import { Logger } from '@nestjs/common';
import { Process, Processor, OnQueueFailed, OnQueueActive, OnQueueCompleted } from '@nestjs/bull';
import type { Job } from 'bull';
import { PaymentsService } from './payments.service';

// @Processor connects this class to the 'payments' queue
@Processor('payments')
export class PaymentsProcessor {
  private readonly logger = new Logger('PaymentsProcessor');

  constructor(private paymentsService: PaymentsService) {
    this.logger.log('PaymentsProcessor initialized and listening to payments queue');
  }

  @OnQueueActive()
  onActive(job: Job): void {
    this.logger.log(`[QUEUE] Job ${job.id} is now active`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job): void {
    this.logger.log(`[QUEUE] Job ${job.id} completed successfully`);
  }

  // @Process('name') handles jobs with that name
  @Process('process-payment')
  async handlePaymentProcessing(job: Job<any>): Promise<void> {
    this.logger.log(`[HANDLER] processing payment job ${job.id}`);

    try {
      await this.paymentsService.processWebhookEvent(job.data);
      this.logger.log(`[HANDLER] job ${job.id} completed successfully`);
    } catch (error) {
      // if you throw an error, Bull marks it as failed and retries
      this.logger.error(`[HANDLER] job ${job.id} failed:`, error.message);
      this.logger.error('[HANDLER] Stack trace:', error.stack);
      throw error;
    }
  }

  // called when a job fails ALL retries
  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(`[QUEUE] job ${job.id} exhausted all retries`, {
      jobData: job.data,
      error: error.message,
      attempts: job.attemptsMade,
    });
    // here you could alert Slack, PagerDuty, or send email to your team
  }
}
