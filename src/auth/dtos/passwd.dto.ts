import { IsString } from 'class-validator';

export class PasswdDTO {
  @IsString()
  password: string;
  @IsString()
  newPassword: string;
}
