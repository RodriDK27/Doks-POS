import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BulkDeleteRequestedProductsDto {
  @IsArray({ message: 'Los artículos deben ser una lista' })
  @ArrayMinSize(1, { message: 'Debe enviar al menos un artículo' })
  @IsString({ each: true, message: 'Cada ID debe ser texto' })
  ids: string[];
}
