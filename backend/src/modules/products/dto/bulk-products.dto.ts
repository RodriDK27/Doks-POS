import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Tamaño máximo de una tanda. El editor avanzado manda cientos de artículos en varias tandas. */
export const BULK_MAX_ROWS = 250;

/** Una fila del editor avanzado: con `id` actualiza ese producto; sin `id` crea uno nuevo */
export class BulkProductRowDto {
  @IsString({ message: 'El ID del producto debe ser texto' })
  @IsOptional()
  id?: string;

  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(200, { message: 'El nombre no puede tener más de 200 caracteres' })
  name: string;

  @IsIn(['PIECE', 'WEIGHT'], { message: 'El tipo debe ser Pieza o Granel' })
  unitType: 'PIECE' | 'WEIGHT';

  @IsString({ message: 'El código de barras debe ser texto' })
  @IsOptional()
  barcode?: string;

  @IsNumber({}, { message: 'El precio de compra debe ser un número' })
  @Min(0, { message: 'El precio de compra no puede ser menor a 0' })
  purchasePrice: number;

  @IsNumber({}, { message: 'El precio de venta debe ser un número' })
  @Min(0, { message: 'El precio de venta no puede ser menor a 0' })
  sellPrice: number;

  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock no puede ser menor a 0' })
  stock: number;

  @IsString({ message: 'La categoría debe ser texto' })
  @IsOptional()
  category?: string;
}

export class BulkProductsDto {
  @IsArray({ message: 'Los productos deben ser una lista' })
  @ArrayMinSize(1, { message: 'Debe enviar al menos un producto' })
  @ArrayMaxSize(BULK_MAX_ROWS, { message: `Máximo ${BULK_MAX_ROWS} productos por tanda` })
  @ValidateNested({ each: true })
  @Type(() => BulkProductRowDto)
  rows: BulkProductRowDto[];
}
