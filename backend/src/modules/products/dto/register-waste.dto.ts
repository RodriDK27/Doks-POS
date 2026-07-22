import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn } from 'class-validator';

export class RegisterWasteDto {
  @IsString({ message: 'El ID del producto debe ser texto' })
  @IsNotEmpty({ message: 'El producto es obligatorio' })
  productId: string;

  @IsString({ message: 'El tipo de movimiento debe ser texto' })
  @IsIn(['CONSUMO_INTERNO', 'MERMA_ROTO', 'MERMA_CADUCADO', 'DEVOLUCION', 'AJUSTE'], {
    message: 'El tipo debe ser CONSUMO_INTERNO, MERMA_ROTO, MERMA_CADUCADO, DEVOLUCION o AJUSTE',
  })
  type: 'CONSUMO_INTERNO' | 'MERMA_ROTO' | 'MERMA_CADUCADO' | 'DEVOLUCION' | 'AJUSTE';

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  quantity: number;

  @IsString({ message: 'El responsable debe ser texto' })
  @IsOptional()
  responsibleName?: string;

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;
}
