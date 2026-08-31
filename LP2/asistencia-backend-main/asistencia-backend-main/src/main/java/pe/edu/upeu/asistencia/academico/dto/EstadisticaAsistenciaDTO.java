package pe.edu.upeu.asistencia.academico.dto;

public class EstadisticaAsistenciaDTO {

    private int total;
    private int presentes;
    private int tardanzas;
    private int ausentes;
    private int justificados;

    private double porcentajeAsistencia;

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getPresentes() {
        return presentes;
    }

    public void setPresentes(int presentes) {
        this.presentes = presentes;
    }

    public int getTardanzas() {
        return tardanzas;
    }

    public void setTardanzas(int tardanzas) {
        this.tardanzas = tardanzas;
    }

    public int getAusentes() {
        return ausentes;
    }

    public void setAusentes(int ausentes) {
        this.ausentes = ausentes;
    }

    public int getJustificados() {
        return justificados;
    }

    public void setJustificados(int justificados) {
        this.justificados = justificados;
    }

    public double getPorcentajeAsistencia() {
        return porcentajeAsistencia;
    }

    public void setPorcentajeAsistencia(double porcentajeAsistencia) {
        this.porcentajeAsistencia = porcentajeAsistencia;
    }
}