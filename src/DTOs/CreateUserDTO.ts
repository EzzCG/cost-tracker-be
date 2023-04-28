import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Validate,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  readonly name: string;

  @IsString()
  readonly surname: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(8)
  readonly password: string;

  readonly role?: string = 'user';
}
