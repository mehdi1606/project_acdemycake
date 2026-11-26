package com.academy.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class InvoiceCsvCellTest {

    @Test
    @DisplayName("CSV cells: quoted when needed, formulas neutralised, phones kept")
    void cells() {
        assertEquals("Sara", AdminInvoiceServiceImpl.cell("Sara"));
        assertEquals("\"a;b\"", AdminInvoiceServiceImpl.cell("a;b"));
        assertEquals("\"say \"\"hi\"\"\"", AdminInvoiceServiceImpl.cell("say \"hi\""));
        assertEquals("'=SUM(A1)", AdminInvoiceServiceImpl.cell("=SUM(A1)"));
        assertEquals("'@cmd", AdminInvoiceServiceImpl.cell("@cmd"));
        assertEquals("+212 611 223 344", AdminInvoiceServiceImpl.cell("+212 611 223 344"));
        assertEquals("", AdminInvoiceServiceImpl.cell(null));
    }
}
