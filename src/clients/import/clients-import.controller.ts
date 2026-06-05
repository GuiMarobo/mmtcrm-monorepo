import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger'
import { ClientsImportService } from './clients-import.service'
import { ImportReportDto } from './dto/import-report.dto'
import { Roles } from '../../auth/decorators/roles.decorator'
import { RoleEnum } from '../../users/dto/create-user.dto'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB — cobre CSVs com milhares de linhas

@ApiBearerAuth()
@Roles(RoleEnum.ADMIN, RoleEnum.VENDEDOR, RoleEnum.ATENDENTE)
@Controller('clients/import')
export class ClientsImportController {
  constructor(private readonly importService: ClientsImportService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiQuery({ name: 'dryRun', required: false, type: Boolean })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }),
  )
  async import(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('dryRun') dryRun?: string,
  ): Promise<ImportReportDto> {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório (campo "file").')
    }

    const isCsv =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv')
    if (!isCsv) {
      throw new BadRequestException('Apenas arquivos .csv são aceitos.')
    }

    const isDryRun = dryRun === 'true'

    return this.importService.importCsv(file.buffer, isDryRun)
  }
}
