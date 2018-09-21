import { Module } from '@nestjs/common';
import { DogHealth } from './dog.health';
import { DogService } from './dog.service';
import { TerminusModule } from '../../../../lib';

@Module({
  imports: [
    TerminusModule.forRoot({
      healthUrl: '/healthcheck',
    }),
  ],
  providers: [DogService, DogHealth],
})
export class DogModule {}
