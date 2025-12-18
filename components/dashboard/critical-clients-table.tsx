'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Empresa, CobrancaPonto } from '@/lib/types'
import { getStatusPontoLabel, getStatusPontoVariant } from '@/lib/utils/status-helpers'
import { formatDate } from '@/lib/utils/date-helpers'

interface CriticalClient {
  empresa: Empresa
  cobranca: CobrancaPonto
}

interface CriticalClientsTableProps {
  clients: CriticalClient[]
}

export function CriticalClientsTable({ clients }: CriticalClientsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Empresas Críticas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dia Cobrança</TableHead>
              <TableHead>Responsável</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma empresa crítica no momento
                </TableCell>
              </TableRow>
            ) : (
              clients.map(({ empresa, cobranca }) => (
                <TableRow key={empresa.id}>
                  <TableCell className="font-mono">{empresa.codigoEmpresa}</TableCell>
                  <TableCell className="font-medium">{empresa.razaoSocial}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusPontoVariant(cobranca.statusEnvioPonto)}>
                      {getStatusPontoLabel(cobranca.statusEnvioPonto)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-blue-600 font-semibold">
                    dia {cobranca.diaCobranca}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cobranca.responsavelInterno}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
