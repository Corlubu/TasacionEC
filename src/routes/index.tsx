import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Camera,
  FileText,
  Map,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const features = [
    {
      icon: Camera,
      title: "Captura Híbrida",
      description:
        "Registro de propiedades con geolocalización GPS y validación de integridad",
    },
    {
      icon: TrendingUp,
      title: "Análisis de Mercado",
      description:
        "Motor de homologación automatizada con comparables y ajustes dinámicos",
    },
    {
      icon: FileText,
      title: "Reportes con IA",
      description:
        "Generación automática de reportes profesionales con justificación técnica",
    },
    {
      icon: Map,
      title: "Análisis Geoespacial",
      description:
        "Evaluación de riesgos y ubicación con integración GIS avanzada",
    },
    {
      icon: Shield,
      title: "Cumplimiento Regulatorio",
      description:
        "Auditoría completa y trazabilidad para estándares bancarios",
    },
    {
      icon: Zap,
      title: "Valoración Rápida",
      description:
        "Reduce el tiempo de valoración de días a horas con automatización",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white bg-opacity-90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                TasaciónEC
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
              >
                Comenzar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Valoración Inmobiliaria
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Automatizada con IA
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Plataforma profesional de avalúo que combina captura móvil, análisis
            de mercado y generación automática de reportes cumpliendo con
            estándares de la Superintendencia de Bancos
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              to="/signup"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
            >
              Comenzar Gratis
            </Link>
            <Link
              to="/login"
              className="bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-all border-2 border-gray-200"
            >
              Ver Demo
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Reducción en Tiempo</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Cumplimiento Regulatorio</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Disponibilidad</div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            ¿Por qué TasaciónEC?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Captura offline-first con sincronización automática",
              "OCR/NLP para extracción de documentos legales",
              "Modelo hedónico con explicabilidad SHAP",
              "Análisis geoespacial con evaluación de riesgos",
              "Reportes generados con IA en minutos",
              "Auditoría inmutable para cumplimiento bancario",
              "Integración con portales inmobiliarios",
              "Dashboard en tiempo real con métricas clave",
            ].map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Listo para transformar tu proceso de valoración?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a los profesionales que ya confían en TasaciónEC
          </p>
          <Link
            to="/signup"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-lg font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Comenzar Ahora
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">TasaciónEC</span>
          </div>
          <p className="text-gray-400 mb-4">
            Plataforma de valoración inmobiliaria profesional
          </p>
          <p className="text-gray-500 text-sm">
            © 2026 TasaciónEC. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
