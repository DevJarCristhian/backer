import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { GetDTO } from '../../common/dto/params-dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: GetDTO) {
    const { search, perPage, page } = dto;
    const searchQuery = search
      ? Prisma.sql`
            AND (
              nombre LIKE ${`%${search}%`} OR
              descripcion LIKE ${`%${search}%`} OR
              descripcion_larga LIKE ${`%${search}%`}
            )
          `
      : Prisma.sql``;

    const query = Prisma.sql`
        SELECT
          condicion AS  \`condition\`,
          descripcion AS description,
          descripcion_larga AS longDescription,
          estado AS status,
          costarica,
          nicaragua,
          panama,
          honduras,
          guatemala,
          id,
          linea AS line,
          maximo_canjes AS maxRedemptions,
          nombre AS name,
          observacion AS observation,
          recibe AS receive,
          unidad_medida AS unitMeasure
        FROM
          productos
        WHERE 1=1 ${searchQuery}
        ORDER BY nombre ASC
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
        FROM productos
        WHERE 1=1 ${searchQuery}
      `;

    const totalResult = await this.prisma.$queryRaw(totalQuery);
    const total = Number(totalResult[0].total);
    const last_page = Math.ceil(total / parseInt(perPage));

    return {
      data,
      total,
      last_page,
    };
  }

  async getAllProducts() {
    const query = Prisma.sql`
        SELECT
          nombre,
          descripcion,
          descripcion_larga,
          recibe,
          condicion,
          maximo_canjes,
          linea,
          estado,
          guatemala,
          honduras,
          panama,
          nicaragua,
          costarica
        FROM productos
    `;
    const data = await this.prisma.$queryRaw(query);
    return data;
  }

  async exportToExcel() {
    const data = (await this.getAllProducts()) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista');
    worksheet.columns = [
      { header: 'Nombre', key: 'nombre', width: 40 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Descripción Larga', key: 'descripcion_larga', width: 40 },
      { header: 'Recibe', key: 'recibe', width: 40 },
      { header: 'Condición', key: 'condicion', width: 40 },
      { header: 'Máximo de Canjes', key: 'maximo_canjes', width: 40 },
      { header: 'Línea', key: 'linea', width: 40 },
      { header: 'Estado', key: 'estado', width: 40 },
      { header: 'Guatemala', key: 'guatemala', width: 40 },
      { header: 'Honduras', key: 'honduras', width: 40 },
      { header: 'Panamá', key: 'panama', width: 40 },
      { header: 'Nicaragua', key: 'nicaragua', width: 40 },
      { header: 'Costa Rica', key: 'costarica', width: 40 },
    ];

    data.forEach((v) => {
      worksheet.addRow({
        nombre: v.nombre,
        descripcion: v.descripcion,
        descripcion_larga: v.descripcion_larga,
        recibe: v.recibe,
        condicion: v.condicion,
        maximo_canjes: v.maximo_canjes,
        linea: v.linea,
        estado: v.estado,
        guatemala: v.guatemala,
        honduras: v.honduras,
        panama: v.panama,
        nicaragua: v.nicaragua,
        costarica: v.costarica,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async findProduct(dto: GetDTO) {
    const { search } = dto;

    const searchQuery = search
      ? Prisma.sql`
          AND (
            nombre LIKE ${`%${search}%`} OR 
            descripcion LIKE ${`%${search}%`} OR 
            descripcion_larga LIKE ${`%${search}%`}
          )
        `
      : Prisma.sql``;

    const query = Prisma.sql`
      SELECT
        nombre AS label,
        id AS value
      FROM 
      productos
      WHERE 1=1 ${searchQuery}
      ORDER BY nombre ASC
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
