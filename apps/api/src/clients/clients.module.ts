import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsImportController } from './import/clients-import.controller';
import { ClientsImportService } from './import/clients-import.service';
import { ErasureModule } from '../erasure/erasure.module';

@Module({
  imports: [PrismaModule, ErasureModule],
  controllers: [ClientsController, ClientsImportController],
  providers: [ClientsService, ClientsImportService],
  exports: [ClientsService],
})
export class ClientsModule {}
