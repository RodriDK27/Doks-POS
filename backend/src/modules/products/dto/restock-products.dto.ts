import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { BULK_MAX_ROWS } from './bulk-products.dto';

/** Cantidad que llegó de un producto: se suma a su existencia actual */
export class RestockItemDto {
  @IsString({ message: 'El ID del producto debe ser texto' })
  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  productId: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.001, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;
}

export class RestockProductsDto {
  @IsArray({ message: 'Los productos deben ser una lista' })
  @ArrayMinSize(1, { message: 'Debe enviar al menos un producto' })
  @ArrayMaxSize(BULK_MAX_ROWS, { message: `Máximo ${BULK_MAX_ROWS} productos por tanda` })
  @ValidateNested({ each: true })
  @Type(() => RestockItemDto)
  items: RestockItemDto[];
}
