import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class VisitorService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(dto: GetDTO) {
    const { search, perPage, page, country } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              v.nombre LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    if (country && country != 0) {
      filterQuery = Prisma.sql`${filterQuery} AND v.id_pais = ${country}`;
    }

    const query = Prisma.sql`
        SELECT
          v.id,
          p.nombre AS countryName,
          v.nombre AS name,
          v.fecha AS date,
          v.updated_at AS updatedAt
        FROM
        visitadores AS v
        LEFT JOIN paises AS p ON v.id_pais = p.id 
        WHERE 1=1 ${searchQuery} ${filterQuery}
        ORDER BY v.id DESC
        LIMIT ${parseInt(perPage)} OFFSET ${(parseInt(page) - 1) * parseInt(perPage)};
      `;

    const data = await this.prisma.$queryRaw(query);

    const totalQuery = Prisma.sql`SELECT COUNT(*) AS total
    FROM visitadores AS v
    LEFT JOIN paises AS p ON v.id_pais = p.id
    WHERE 1=1 ${searchQuery} ${filterQuery}`;

    const totalResult = await this.prisma.$queryRaw(totalQuery);

    const total = Number(totalResult[0].total);
    const last_page = Math.ceil(total / parseInt(perPage));

    return {
      data,
      total,
      last_page,
    };
  }

  async getAllVisitors(dto: GetDTO) {
    const { search, country } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              v.nombre LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    if (country && country != 0) {
      filterQuery = Prisma.sql`${filterQuery} AND v.id_pais = ${country}`;
    }

    const query = Prisma.sql`
        SELECT
          p.nombre AS pais,
          v.nombre,
          v.fecha
        FROM
        visitadores AS v
        LEFT JOIN paises AS p ON v.id_pais = p.id
        WHERE 1=1 ${searchQuery} ${filterQuery}`;

    const data = await this.prisma.$queryRaw(query);
    return data;
  }

  async exportToExcel(dto: GetDTO) {
    const data = (await this.getAllVisitors(dto)) as any[];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista');
    worksheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 40 },
      { header: 'Pais', key: 'pais', width: 40 },
      { header: 'Fecha de Inscripcion', key: 'fecha', width: 20 },
    ];

    data.forEach((v) => {
      worksheet.addRow({
        nombre: v.nombre,
        pais: v.pais,
        fecha: v.fecha,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
