import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class PharmacyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: GetDTO) {
    const { search, perPage, page } = dto;

    const searchQuery = search
      ? Prisma.sql`
          AND (
            f.sucursal LIKE ${`%${search}%`} OR 
            f.telefono LIKE ${`%${search}%`} OR
            ca.cadena LIKE ${`%${search}%`}
          )
        `
      : Prisma.sql``;

    const query = Prisma.sql`
      SELECT 
        f.id,
        f.sucursal AS branch,
        f.telefono AS phone,
        COALESCE(ca.cadena, '-') AS chainName,
        COALESCE(dept.nombre, '-') AS departmentName,
        COALESCE(NULLIF(f.direccion, ""), "-") AS address,
        f.email AS email,
        f.municipio AS municipality
      FROM 
      farmacias AS f
      LEFT JOIN cadena AS ca ON f.id_cadena = ca.id
      LEFT JOIN departamentos AS dept ON f.id_departamento = dept.id
      WHERE 1=1 ${searchQuery}
      ORDER BY f.sucursal ASC
      LIMIT ${parseInt(perPage)} OFFSET ${(parseInt(page) - 1) * parseInt(perPage)};
    `;

    const serializedData = await this.prisma.$queryRaw(query);
    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    const totalQuery = Prisma.sql`
      SELECT COUNT(*) AS total
      FROM farmacias AS f
      LEFT JOIN cadena AS ca ON f.id_cadena = ca.id
      LEFT JOIN departamentos AS dept ON f.id_departamento = dept.id
      WHERE 1=1 ${searchQuery}
      ORDER BY f.sucursal ASC`;

    const totalResult = await this.prisma.$queryRaw(totalQuery);
    const total = Number(totalResult[0].total);
    const last_page = Math.ceil(total / parseInt(perPage));

    return {
      data,
      total,
      last_page,
    };
  }

  async getAllPharmacys(dto: GetDTO) {
    const { search } = dto;

    const searchQuery = search
      ? Prisma.sql`
          AND (
            f.sucursal LIKE ${`%${search}%`} OR 
            f.telefono LIKE ${`%${search}%`} OR
            ca.cadena LIKE ${`%${search}%`}
          )
        `
      : Prisma.sql``;

    const query = Prisma.sql`
      SELECT 
        f.sucursal,
        f.telefono,
        ca.cadena,
        dept.nombre,
        f.direccion,
        f.email
      FROM farmacias AS f
      LEFT JOIN cadena AS ca ON f.id_cadena = ca.id
      LEFT JOIN departamentos AS dept ON f.id_departamento = dept.id
      WHERE 1=1 ${searchQuery}
      ORDER BY f.sucursal ASC`;

    const data = await this.prisma.$queryRaw(query);
    return data;
  }

  async exportToExcel(dto: GetDTO) {
    const data = (await this.getAllPharmacys(dto)) as any[];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista');
    worksheet.columns = [
      { header: 'Sucursal', key: 'sucursal', width: 40 },
      { header: 'Cadena', key: 'cadena', width: 40 },
      { header: 'Departamento', key: 'nombre', width: 40 },
      { header: 'Telefono', key: 'telefono', width: 15 },
      { header: 'Correo', key: 'email', width: 20 },
      { header: 'Direccion', key: 'direccion', width: 20 },
    ];

    data.forEach((v) => {
      worksheet.addRow({
        sucursal: v.sucursal,
        cadena: v.cadena,
        nombre: v.nombre,
        phone: v.phone,
        telefono: v.telefono,
        email: v.email,
        direccion: v.direccion,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async findPharmacy(dto: GetDTO) {
    const { search } = dto;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              sucursal LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    const query = Prisma.sql`
        SELECT
        sucursal AS label,
          id AS value
        FROM 
        farmacias
        WHERE 1=1 ${searchQuery}
        ORDER BY sucursal ASC
        LIMIT 10;
      `;

    const serializedData = await this.prisma.$queryRaw(query);
    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    return data;
  }
}
