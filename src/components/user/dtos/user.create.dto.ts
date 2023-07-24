import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Email field must not be empty.' })
  readonly name: string;

  @IsString()
  @IsNotEmpty({ message: 'Surname field must not be empty.' })
  readonly surname: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email field must not be empty.' })
  readonly email: string;

  @IsNotEmpty({ message: 'Password field must not be empty.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  readonly password: string;

  readonly role?: string;
}
