import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CloseRegisterDto {
  @IsNumber({}, { message: 'El dinero real en caja debe ser un número' })
  @Min(0, { message: 'El dinero real en caja no puede ser menor a 0' })
  actualBalance: number;

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;
}
