import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ChangePinDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 4, { message: 'El PIN actual debe ser de exactamente 4 dígitos.' })
  currentPin: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 4, { message: 'El nuevo PIN debe ser de exactamente 4 dígitos.' })
  newPin: string;
}
