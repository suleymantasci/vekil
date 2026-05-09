import { IsString, IsNumber, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateApartmentDto {
  @IsString()
  number: string; // "101", "102"

  @IsNumber()
  floor: number;

  @IsOptional()
  @IsString()
  block?: string; // A, B, C

  @IsNumber()
  areaM2: number;

  @IsNumber()
  shareRatio: number;

  @IsOptional()
  @IsString()
  type?: string; // residential, commercial

  @IsOptional()
  @IsUUID()
  buildingId: string;
}

export class UpdateApartmentDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsNumber()
  floor?: number;

  @IsOptional()
  @IsString()
  block?: string;

  @IsOptional()
  @IsNumber()
  areaM2?: number;

  @IsOptional()
  @IsNumber()
  shareRatio?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}