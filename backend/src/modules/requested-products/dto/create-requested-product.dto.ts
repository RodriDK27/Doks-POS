import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateRequestedProductDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad mínima es 1' })
  @IsOptional()
  quantity?: number;

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;
}
