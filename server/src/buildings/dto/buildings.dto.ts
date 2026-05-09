import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreateBuildingDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  totalFloors?: number;

  @IsOptional()
  @IsNumber()
  totalApartments?: number;

  @IsOptional()
  @IsString()
  managerName?: string;

  @IsOptional()
  @IsString()
  managerPhone?: string;

  @IsOptional()
  @IsString()
  managerEmail?: string;
}

export class UpdateBuildingDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  totalFloors?: number;

  @IsOptional()
  @IsNumber()
  totalApartments?: number;

  @IsOptional()
  @IsString()
  managerName?: string;

  @IsOptional()
  @IsString()
  managerPhone?: string;

  @IsOptional()
  @IsString()
  managerEmail?: string;
}