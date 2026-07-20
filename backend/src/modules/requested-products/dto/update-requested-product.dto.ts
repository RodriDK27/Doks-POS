import { IsOptional, IsString, IsIn, IsNumber, Min } from 'class-validator';

export class UpdateRequestedProductDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsOptional()
  name?: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  @IsOptional()
  quantity?: number;

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;

  @IsString({ message: 'El estado debe ser texto' })
  @IsIn(['PENDIENTE', 'COMPRADO', 'CANCELADO'], { message: 'Estado no válido' })
  @IsOptional()
  status?: string;
}
