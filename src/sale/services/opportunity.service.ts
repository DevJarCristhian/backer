import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { UpdateOpportunityDto } from '../dto/opportunity/update-opportunity.dto';
import { GetDTO } from '../dto/opportunity/get-opportunity.dto';

@Injectable()
export class OpportunityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: GetDTO) {
    const {
      search,
      perPage,
      page,
      emissionDate,
      patientId,
      productId,
      pharmacyId,
      userId,
      startDate,
      endDate,
    } = dto;

    let filterQuery = Prisma.sql``;
    const searchQuery = search
      ? Prisma.sql`
          AND (
            o.serie_factura LIKE ${`%${search}%`} OR 
            o.no_factura LIKE ${`%${search}%`} OR 
            o.fecha_facturacion LIKE ${`%${search}%`} OR
            pa.numero_documento LIKE ${`%${search}%`} OR
            pa.nombre LIKE ${`%${search}%`} OR
            pa.apellido LIKE ${`%${search}%`} OR
            pa.descripcion LIKE ${`%${search}%`}
          )
        `
      : Prisma.sql``;

    if (patientId) {
      filterQuery = Prisma.sql`${filterQuery} AND o.id_paciente = ${patientId}`;
    }

    if (productId) {
      filterQuery = Prisma.sql`${filterQuery} AND o.id_producto = ${productId}`;
    }

    if (pharmacyId) {
      filterQuery = Prisma.sql`${filterQuery} AND o.id_farmacia = ${pharmacyId}`;
    }

    if (userId) {
      filterQuery = Prisma.sql`${filterQuery} AND o.usuario_modifica = ${userId}`;
    }

    if (emissionDate) {
      filterQuery = Prisma.sql`${filterQuery} AND o.fecha_facturacion = ${emissionDate}`;
    }

    if (startDate && endDate) {
      const endDateTime = endDate + ' 23:59:59';
      filterQuery = Prisma.sql`${filterQuery} AND o.fecha_facturacion BETWEEN ${startDate} AND ${endDateTime}`;
    }

    if (startDate && !endDate) {
      filterQuery = Prisma.sql`${filterQuery} AND o.fecha_facturacion = ${startDate}`;
    }

    const query = Prisma.sql`
      SELECT 
        o.id,
        pa.numero_documento as documentNumber,
        CONCAT(pa.nombre, ' ', pa.apellido) AS patientFullName,
        fa.sucursal as farmacyName,
        pro.descripcion as productName,
        o.serie_factura as invoiceSerie,
        o.no_factura as invoiceNumber,
        o.cantidad as quantity,
        o.fecha_facturacion as invoiceDate,
        o.fecha_actualiza as dateUpdated
      FROM 
        oportunidades AS o
      LEFT JOIN pacientes AS pa ON o.id_paciente = pa.id
      LEFT JOIN farmacias AS fa ON o.id_farmacia = fa.id
      LEFT JOIN productos AS pro ON o.id_producto = pro.id
      WHERE 1=1 ${searchQuery} ${filterQuery}
      ORDER BY o.id DESC
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
      FROM oportunidades AS o
      LEFT JOIN pacientes AS pa ON o.id_paciente = pa.id
      LEFT JOIN farmacias AS fa ON o.id_farmacia = fa.id
      LEFT JOIN productos AS pro ON o.id_producto = pro.id
      WHERE 1=1 ${searchQuery} ${filterQuery}
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

  async getOpportunityById(id: number) {
    const query = Prisma.sql`
          SELECT
            o.id,
            o.activo AS active,
            o.cantidades_utilizadas AS usedQuantity,
            o.anulacion AS cancellation,
            o.fecha_bonificacion AS certificationDate,
            o.estado_canje AS exchangeState,
            o.validacion AS validation,
            o.fecha_ultima_toma AS lastDateTaken,
            o.fecha_abandono_tratamiento AS dateAbandonTreatment,
            o.id_motivo_compra AS reasonBuyId,
            o.id_motivo_anulacion AS reasonAnulationId,
            o.id_diagnostico AS diagnosisId,
            o.id_dosis AS doseId,
            o.id_tiempo_tratamiento AS treatmentTimeId,
            o.observaciones AS observations,
            o.fecha_actualiza AS dateUpdated
          FROM
           oportunidades AS o
          WHERE o.id = ${id}
        `;

    const serializedData = await this.prisma.$queryRaw(query);

    const newData = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    const data = newData.map((v: any) => ({
      ...v,
      reasonBuyId: parseInt(v.reasonBuyId),
      reasonAnulationId: parseInt(v.reasonAnulationId),
      diagnosisId: parseInt(v.diagnosisId),
      doseId: parseInt(v.doseId),
      treatmentTimeId: parseInt(v.treatmentTimeId),
    }));

    return {
      data: data[0],
    };
  }

  async getAllOpportunities() {
    const query = Prisma.sql`
      SELECT
        o.serie_factura,
        o.no_factura,
        o.fecha_facturacion,
        CONCAT(pa.nombre, " ", pa.apellido) AS nombre_completo,
        pa.numero_documento,
        pro.descripcion AS nombre_producto,
        o.cantidad,
        fa.sucursal AS nombre_farmacia,
        o.cantidades_utilizadas,
        o.activo,
        o.estado_canje,
        o.validacion,
        o.observaciones,
        o.fecha_bonificacion,
        o.fecha_ultima_toma,
        o.fecha_abandono_tratamiento,
        o.anulacion,
        o.id_usuario_anulacion,
        o.id_motivo_compra,
        o.id_motivo_anulacion,
        o.id_diagnostico,
        o.id_dosis,
        o.id_tiempo_tratamiento,
        o.id_otros
      FROM
        oportunidades AS o
        LEFT JOIN pacientes AS pa ON o.id_paciente = pa.id
        LEFT JOIN farmacias AS fa ON o.id_farmacia = fa.id
        LEFT JOIN productos AS pro ON o.id_producto = pro.id
    `;
    const serializedData = await this.prisma.$queryRaw(query);

    const data = JSON.parse(
      JSON.stringify(serializedData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    return data;
    // -- o.fecha_creacion,
    // -- o.fecha_actualiza,
    // -- o.usuario_crea,
    // -- o.usuario_modifica
  }

  async exportToExcel() {
    const data = (await this.getAllOpportunities()) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista');
    worksheet.columns = [
      { header: 'Serie Factura', key: 'serie_factura', width: 40 },
      { header: 'Número Factura', key: 'no_factura', width: 40 },
      { header: 'Fecha Facturación', key: 'fecha_facturacion', width: 40 },
      { header: 'Nombre', key: 'nombre_completo', width: 40 },
      { header: 'Número Documento', key: 'numero_documento', width: 40 },
      { header: 'Producto', key: 'nombre_producto', width: 40 },
      { header: 'Cantidad', key: 'cantidad', width: 40 },
      { header: 'Farmacia', key: 'nombre_farmacia', width: 40 },
      {
        header: 'Cantidades Utilizadas',
        key: 'cantidades_utilizadas',
        width: 40,
      },
      { header: 'Activo', key: 'activo', width: 40 },
      { header: 'Estado Canje', key: 'estado_canje', width: 40 },
      { header: 'Validación', key: 'validacion', width: 40 },
      { header: 'Observaciones', key: 'observaciones', width: 40 },
      { header: 'Fecha Bonificación', key: 'fecha_bonificacion', width: 40 },
      { header: 'Fecha Última Toma', key: 'fecha_ultima_toma', width: 40 },
      {
        header: 'Fecha Abandono Tratamiento',
        key: 'fecha_abandono_tratamiento',
        width: 40,
      },
      { header: 'Anulación', key: 'anulacion', width: 40 },
      { header: 'Usuario Anulación', key: 'id_usuario_anulacion', width: 40 },
      { header: 'Motivo Compra', key: 'id_motivo_compra', width: 40 },
      { header: 'Motivo Anulación', key: 'id_motivo_anulacion', width: 40 },
      { header: 'Diagnóstico', key: 'id_diagnostico', width: 40 },
      { header: 'Dosis', key: 'id_dosis', width: 40 },
      { header: 'Tiempo Tratamiento', key: 'id_tiempo_tratamiento', width: 40 },
      { header: 'Otros', key: 'id_otros', width: 40 },
    ];

    data.forEach((v) => {
      worksheet.addRow({
        serie_factura: v.serie_factura,
        no_factura: v.no_factura,
        fecha_facturacion: v.fecha_facturacion,
        nombre_completo: v.nombre_completo,
        numero_documento: v.numero_documento,
        nombre_producto: v.nombre_producto,
        cantidad: v.cantidad,
        nombre_farmacia: v.nombre_farmacia,
        cantidades_utilizadas: v.cantidades_utilizadas,
        activo: v.activo,
        estado_canje: v.estado_canje,
        validacion: v.validacion,
        observaciones: v.observaciones,
        fecha_bonificacion: v.fecha_bonificacion,
        fecha_ultima_toma: v.fecha_ultima_toma,
        fecha_abandono_tratamiento: v.fecha_abandono_tratamiento,
        anulacion: v.anulacion,
        id_usuario_anulacion: v.id_usuario_anulacion,
        id_motivo_compra: v.id_motivo_compra,
        id_motivo_anulacion: v.id_motivo_anulacion,
        id_diagnostico: v.id_diagnostico,
        id_dosis: v.id_dosis,
        id_tiempo_tratamiento: v.id_tiempo_tratamiento,
        id_otros: v.id_otros,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async updateOpportunity(user: number, id: number, dto: UpdateOpportunityDto) {
    // console.log(dto);
    const query = Prisma.sql`
        UPDATE oportunidades
        SET
        id_motivo_compra = ${dto.reasonBuyId},
        id_motivo_anulacion = ${dto.reasonAnulationId},
        id_diagnostico = ${dto.diagnosisId},
        id_dosis = ${dto.doseId},
        id_tiempo_tratamiento = ${dto.treatmentTimeId},
        fecha_ultima_toma = ${dto.lastDateTaken},
        fecha_abandono_tratamiento = ${dto.dateAbandonTreatment},
        observaciones = ${dto.observations},
        fecha_actualiza = ${new Date()},
        usuario_modifica = ${user}
        WHERE id = ${id};
      `;

    await this.prisma.$queryRaw(query);

    return 'Oportunidad actualizada correctamente';
  }
}
