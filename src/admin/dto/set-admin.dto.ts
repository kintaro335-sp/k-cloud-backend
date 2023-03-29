import { IsBoolean } from 'class-validator';

export class SetAdminDTO {
  @IsBoolean()
  admin: boolean;
}
