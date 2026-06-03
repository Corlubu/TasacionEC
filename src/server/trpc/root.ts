import { createCallerFactory, createTRPCRouter } from "~/server/trpc/main";
import * as auth from "./procedures/auth";
import * as properties from "./procedures/properties";
import * as photos from "./procedures/photos";
import * as reports from "./procedures/reports";
import * as searchProcedures from "./procedures/searchPropertiesNearLocation";
import * as pdf from "./procedures/pdf";
import * as valuationRequests from "./procedures/valuationRequests";
import * as additionalWorks from "./procedures/additionalWorks";
import * as users from "./procedures/users";

export const appRouter = createTRPCRouter({
  // Authentication
  signup: auth.signup,
  login: auth.login,
  getCurrentUser: auth.getCurrentUser,

  // Properties
  createProperty: properties.createProperty,
  updateProperty: properties.updateProperty,
  deleteProperty: properties.deleteProperty,
  getProperties: properties.getProperties,
  getProperty: properties.getProperty,
  getPropertyStats: properties.getPropertyStats,
  importProperties: properties.importProperties,
  searchPropertiesNearLocation: searchProcedures.searchPropertiesNearLocation,

  // Valuation Requests
  createValuationRequest: valuationRequests.createValuationRequest,
  getValuationRequest: valuationRequests.getValuationRequest,
  updateValuationRequest: valuationRequests.updateValuationRequest,
  deleteValuationRequest: valuationRequests.deleteValuationRequest,

  // Additional Works
  createAdditionalWork: additionalWorks.createAdditionalWork,
  getAdditionalWorks: additionalWorks.getAdditionalWorks,
  getAdditionalWork: additionalWorks.getAdditionalWork,
  updateAdditionalWork: additionalWorks.updateAdditionalWork,
  deleteAdditionalWork: additionalWorks.deleteAdditionalWork,

  // Photos
  generateUploadUrl: photos.generateUploadUrl,
  generateBatchUploadUrls: photos.generateBatchUploadUrls,
  confirmPhotoUpload: photos.confirmPhotoUpload,
  getPropertyPhotos: photos.getPropertyPhotos,
  deletePropertyPhoto: photos.deletePropertyPhoto,

  // Reports
  generateReport: reports.generateReport,
  getReport: reports.getReport,
  getReports: reports.getReports,
  updateReportStatus: reports.updateReportStatus, // 👈 ¡NUEVA LÍNEA AGREGADA AQUÍ!

  // PDF Generation
  generatePDF: pdf.generatePDF,

  // Users (Panel de Administración)
  getUsers: users.getUsers,
  updateUserRole: users.updateUserRole,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
