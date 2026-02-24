<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Chart of Accounts</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #1e293b;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #3b82f6;
        }
        .header h1 {
            font-size: 18px;
            color: #1e40af;
            margin-bottom: 5px;
        }
        .header p {
            font-size: 11px;
            color: #64748b;
        }
        .unit-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .unit-header {
            background-color: #eff6ff;
            padding: 10px 15px;
            border-left: 4px solid #3b82f6;
            margin-bottom: 10px;
        }
        .unit-header h2 {
            font-size: 13px;
            color: #1e40af;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
            padding: 8px 6px;
            text-align: left;
            border-bottom: 2px solid #e2e8f0;
        }
        td {
            padding: 6px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .ma-row {
            background-color: #fafafa;
            font-weight: 600;
        }
        .ma-row td {
            border-bottom: 1px solid #cbd5e1;
        }
        .sub-row td {
            padding-left: 20px;
        }
        .detail-row td {
            padding-left: 40px;
            color: #64748b;
        }
        .kode {
            font-family: 'DejaVu Sans Mono', monospace;
            color: #2563eb;
            font-size: 9px;
        }
        .jumlah {
            text-align: right;
            font-family: 'DejaVu Sans Mono', monospace;
            white-space: nowrap;
        }
        .total-row {
            background-color: #dbeafe;
            font-weight: 700;
        }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>CHART OF ACCOUNTS (COA)</h1>
        <p>Tahun Anggaran: {{ $tahun ?? date('Y') }} | Dicetak: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    @foreach($data as $unit)
        <div class="unit-section">
            <div class="unit-header">
                <h2>{{ $unit['unit_nama'] ?? 'Unit' }}</h2>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 80px;">Kode</th>
                        <th>Nama</th>
                        <th style="width: 60px;">Jenis</th>
                        <th style="width: 50px;">Volume</th>
                        <th style="width: 50px;">Satuan</th>
                        <th style="width: 100px;">Harga Satuan</th>
                        <th style="width: 110px;">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    @php $unitTotal = 0; @endphp
                    @foreach($unit['mata_anggarans'] as $ma)
                        @php
                            $maTotal = collect($ma['sub_mata_anggarans'] ?? [])
                                ->flatMap(fn($sub) => $sub['detail_mata_anggarans'] ?? [])
                                ->sum('jumlah');
                            $unitTotal += $maTotal;
                        @endphp
                        <tr class="ma-row">
                            <td class="kode">{{ $ma['kode'] }}</td>
                            <td>{{ $ma['nama'] }}</td>
                            <td>{{ $ma['jenis'] ?? '-' }}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td class="jumlah">Rp {{ number_format($maTotal, 0, ',', '.') }}</td>
                        </tr>

                        @foreach($ma['sub_mata_anggarans'] ?? [] as $sub)
                            @php
                                $subTotal = collect($sub['detail_mata_anggarans'] ?? [])->sum('jumlah');
                            @endphp
                            <tr class="sub-row">
                                <td class="kode">{{ $sub['kode'] }}</td>
                                <td>{{ $sub['nama'] }}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td class="jumlah">Rp {{ number_format($subTotal, 0, ',', '.') }}</td>
                            </tr>

                            @foreach($sub['detail_mata_anggarans'] ?? [] as $detail)
                                <tr class="detail-row">
                                    <td class="kode">{{ $detail['kode'] ?? '' }}</td>
                                    <td>{{ $detail['nama'] ?? '' }}</td>
                                    <td></td>
                                    <td>{{ $detail['volume'] ?? '' }}</td>
                                    <td>{{ $detail['satuan'] ?? '' }}</td>
                                    <td class="jumlah">{{ $detail['harga_satuan'] ? 'Rp ' . number_format($detail['harga_satuan'], 0, ',', '.') : '' }}</td>
                                    <td class="jumlah">Rp {{ number_format($detail['jumlah'] ?? 0, 0, ',', '.') }}</td>
                                </tr>
                            @endforeach
                        @endforeach
                    @endforeach

                    <tr class="total-row">
                        <td colspan="6" style="text-align: right; padding-right: 10px;"><strong>Total Unit:</strong></td>
                        <td class="jumlah"><strong>Rp {{ number_format($unitTotal, 0, ',', '.') }}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endforeach

    <div class="footer">
        <p>Dokumen ini digenerate secara otomatis oleh Sistem Anggaran</p>
    </div>
</body>
</html>
