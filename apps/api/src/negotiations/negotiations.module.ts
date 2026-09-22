import { Module } from '@nestjs/common';
import { NegotiationsService } from './negotiations.service';
import { NegotiationsController } from './negotiations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, ProductsModule],
  controllers: [NegotiationsController],
  providers: [NegotiationsService],
  exports: [NegotiationsService],
})
export class NegotiationsModule {}
