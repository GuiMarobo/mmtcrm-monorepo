import { Module } from '@nestjs/common';
import { ErasureService } from './erasure.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ErasureService],
  exports: [ErasureService],
})
export class ErasureModule {}
