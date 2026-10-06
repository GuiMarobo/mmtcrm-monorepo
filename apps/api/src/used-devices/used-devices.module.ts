import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsedDevicesController } from './used-devices.controller';
import { UsedDevicesService } from './used-devices.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsedDevicesController],
  providers: [UsedDevicesService],
})
export class UsedDevicesModule {}
