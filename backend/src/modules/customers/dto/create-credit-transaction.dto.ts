import { IsNumber, IsOptional, IsString, IsPositive } from 'class-validator';

export class CreateCreditTransactionDto {
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto del abono debe ser mayor a 0' })
  amount: number;

  @IsString({ message: 'Las notas deben ser texto' })
  @IsOptional()
  notes?: string;
}
