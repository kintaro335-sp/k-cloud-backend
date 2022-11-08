import { IsNumber } from "class-validator";

export class FileInitDTO {
  @IsNumber()
  size: number;
}
