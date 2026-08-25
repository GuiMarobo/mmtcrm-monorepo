import { Module } from '@nestjs/common';
import { NegotiationsService } from './negotiations.service';
import { NegotiationsController } from './negotiations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NegotiationsController],
  providers: [NegotiationsService],
  exports: [NegotiationsService],
})
export class NegotiationsModule {}
