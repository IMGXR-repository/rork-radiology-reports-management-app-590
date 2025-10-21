export type Language = 'es' | 'en' | 'de' | 'fr' | 'pt' | 'it';

export interface Translations {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    copy: string;
    share: string;
    search: string;
    filter: string;
    confirm: string;
    ok: string;
    yes: string;
    no: string;
    loading: string;
    error: string;
    success: string;
    clear: string;
    all: string;
    back: string;
    next: string;
    close: string;
  };
  settings: {
    title: string;
    appearance: string;
    theme: string;
    language: string;
    lightMode: string;
    darkMode: string;
    behavior: string;
    favoritesFirst: string;
    favoritesFirstDescription: string;
    syncAndBackup: string;
    backupManagement: string;
    backupManagementDescription: string;
    myQRCode: string;
    myQRCodeDescription: string;
    information: string;
    about: string;
    aboutDescription: string;
    version: string;
    user: string;
    signIn: string;
    signInDescription: string;
    createAccount: string;
    createAccountDescription: string;
    signOut: string;
    signOutDescription: string;
    sharedItems: string;
    sharedItemsDescription: string;
    professionalInfo: string;
    dni: string;
    location: string;
    specialty: string;
    selectLanguage: string;
  };
  reports: {
    title: string;
    noReports: string;
    noReportsDescription: string;
    createReport: string;
    searchPlaceholder: string;
    filters: string;
    categories: string;
    activeFilters: string;
    noReportsFound: string;
    noReportsFoundDescription: string;
    titleLabel: string;
    contentLabel: string;
    saveReport: string;
    editReport: string;
    deleteReport: string;
    confirmDelete: string;
    reportDeleted: string;
    reportSaved: string;
  };
  phrases: {
    title: string;
    noPhrases: string;
    noPhrasesDescription: string;
    createPhrase: string;
    searchPlaceholder: string;
    filters: string;
    categories: string;
    textLabel: string;
    savePhrase: string;
    editPhrase: string;
    deletePhrase: string;
    confirmDelete: string;
    phraseDeleted: string;
    phraseSaved: string;
  };
  recording: {
    title: string;
    generating: string;
    selectBaseReport: string;
    noneSelected: string;
    searchReport: string;
    record: string;
    stop: string;
    newReport: string;
    transcribing: string;
    freeText: string;
    outputLanguage: string;
    createReport: string;
    deleteLastText: string;
    deleteAllText: string;
    confirmDeleteAll: string;
    findings: string;
    conclusion: string;
    differentials: string;
    findingsPlaceholder: string;
    conclusionPlaceholder: string;
    differentialsPlaceholder: string;
  };
  dictaphone: {
    title: string;
    subtitle: string;
    iaMode: string;
    dictationMode: string;
    recording: string;
    processingTranscription: string;
    useMicrophoneKeyboard: string;
    typeOrUse: string;
    save: string;
    clear: string;
    recordings: string;
    sendToIA: string;
    signInRequired: string;
  };
  aiChat: {
    title: string;
    askAnything: string;
    placeholder: string;
    noMessages: string;
    noMessagesDescription: string;
    typingIndicator: string;
  };
  productivity: {
    title: string;
    totalCopies: string;
    todayCopies: string;
    weekCopies: string;
    monthCopies: string;
    reportsCopied: string;
    phrasesCopied: string;
    aiUsage: string;
    recordings: string;
    reportsGenerated: string;
    chatQueries: string;
    interactionTime: string;
    hours: string;
  };
  backup: {
    title: string;
    createBackup: string;
    restoreBackup: string;
    exportData: string;
    importData: string;
    backupCreated: string;
    backupRestored: string;
    selectFile: string;
    autoBackup: string;
    autoBackupEnabled: string;
    frequency: string;
    days: string;
  };
  permissions: {
    microphoneTitle: string;
    microphoneMessage: string;
    cameraTitle: string;
    cameraMessage: string;
    storageTitle: string;
    storageMessage: string;
    allow: string;
    deny: string;
  };
  errors: {
    generic: string;
    networkError: string;
    authError: string;
    permissionDenied: string;
    fileNotFound: string;
    invalidData: string;
  };
}

export const translations: Record<Language, Translations> = {
  es: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      copy: 'Copiar',
      share: 'Compartir',
      search: 'Buscar',
      filter: 'Filtrar',
      confirm: 'Confirmar',
      ok: 'Aceptar',
      yes: 'Sí',
      no: 'No',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      clear: 'Limpiar',
      all: 'Todos',
      back: 'Atrás',
      next: 'Siguiente',
      close: 'Cerrar',
    },
    settings: {
      title: 'Configuración',
      appearance: 'Apariencia',
      theme: 'Tema',
      language: 'Idioma',
      lightMode: 'Modo claro',
      darkMode: 'Modo oscuro',
      behavior: 'Comportamiento',
      favoritesFirst: 'Favoritos primero',
      favoritesFirstDescription: 'Mostrar informes favoritos al inicio de la lista',
      syncAndBackup: 'Sincronización y Respaldo',
      backupManagement: 'Gestión de Respaldos',
      backupManagementDescription: 'Crear, restaurar y administrar respaldos de datos',
      myQRCode: 'Mi Código QR',
      myQRCodeDescription: 'Código único para sincronizar con otros dispositivos',
      information: 'Información',
      about: 'Acerca de RAD-IA',
      aboutDescription: 'Versión e información de la aplicación',
      version: 'Versión',
      user: 'Usuario',
      signIn: 'Iniciar sesión',
      signInDescription: 'Accede con una cuenta existente',
      createAccount: 'Crear cuenta nueva',
      createAccountDescription: 'Registro completo con información profesional',
      signOut: 'Cerrar sesión',
      signOutDescription: 'Salir de tu cuenta',
      sharedItems: 'Elementos compartidos',
      sharedItemsDescription: 'recibidos, enviados',
      professionalInfo: 'Información Profesional',
      dni: 'DNI',
      location: 'Ubicación',
      specialty: 'Especialidad',
      selectLanguage: 'Seleccionar idioma',
    },
    reports: {
      title: 'PREF - Informes',
      noReports: 'No hay informes guardados',
      noReportsDescription: 'Crea tu primer informe médico',
      createReport: 'Crear Informe',
      searchPlaceholder: 'Buscar informes...',
      filters: 'Filtros',
      categories: 'Categorías',
      activeFilters: 'filtros activos',
      noReportsFound: 'No se encontraron informes',
      noReportsFoundDescription: 'Intenta ajustar los filtros de búsqueda',
      titleLabel: 'Título',
      contentLabel: 'Contenido',
      saveReport: 'Guardar informe',
      editReport: 'Editar informe',
      deleteReport: 'Eliminar informe',
      confirmDelete: '¿Estás seguro de que deseas eliminar este informe?',
      reportDeleted: 'Informe eliminado',
      reportSaved: 'Informe guardado',
    },
    phrases: {
      title: 'Frases',
      noPhrases: 'No hay frases guardadas',
      noPhrasesDescription: 'Crea tu primera frase común',
      createPhrase: 'Crear Frase',
      searchPlaceholder: 'Buscar frases...',
      filters: 'Filtros',
      categories: 'Categorías',
      textLabel: 'Texto',
      savePhrase: 'Guardar frase',
      editPhrase: 'Editar frase',
      deletePhrase: 'Eliminar frase',
      confirmDelete: '¿Estás seguro de que deseas eliminar esta frase?',
      phraseDeleted: 'Frase eliminada',
      phraseSaved: 'Frase guardada',
    },
    recording: {
      title: 'Generación de Informes RAD-IA',
      generating: 'Generando...',
      selectBaseReport: 'Informe Base',
      noneSelected: 'Ninguno seleccionado',
      searchReport: 'Buscar informe...',
      record: 'Grabar',
      stop: 'Detener',
      newReport: 'Nuevo Informe',
      transcribing: 'Transcribiendo automáticamente...',
      freeText: 'TEXTO',
      outputLanguage: 'Idioma de Salida',
      createReport: 'Crear Informe',
      deleteLastText: 'Borrar Último',
      deleteAllText: 'Borrar Todo',
      confirmDeleteAll: '¿Estás seguro de que quieres borrar todo el texto?',
      findings: 'Hallazgos',
      conclusion: 'Conclusión',
      differentials: 'Diferenciales',
      findingsPlaceholder: 'Los hallazgos aparecerán aquí...',
      conclusionPlaceholder: 'Las conclusiones aparecerán aquí...',
      differentialsPlaceholder: 'Los diagnósticos diferenciales aparecerán aquí...',
    },
    dictaphone: {
      title: 'Dictáfono',
      subtitle: 'Graba y transcribe audio en tiempo real',
      iaMode: 'Modo IA',
      dictationMode: 'Modo Dictado',
      recording: 'Grabando',
      processingTranscription: 'Procesando y mejorando transcripción...',
      useMicrophoneKeyboard: 'Usa el micrófono de tu teclado para dictar',
      typeOrUse: 'Escribe o usa el micrófono del teclado...',
      save: 'Guardar',
      clear: 'Limpiar',
      recordings: 'Grabaciones',
      sendToIA: 'Enviar a IA',
      signInRequired: 'Inicia sesión para acceder al Dictáfono',
    },
    aiChat: {
      title: 'Chat IA',
      askAnything: 'Pregunta lo que necesites',
      placeholder: 'Escribe tu mensaje...',
      noMessages: 'No hay mensajes aún',
      noMessagesDescription: 'Inicia una conversación con el asistente IA',
      typingIndicator: 'Escribiendo...',
    },
    productivity: {
      title: 'Productividad',
      totalCopies: 'Copias totales',
      todayCopies: 'Hoy',
      weekCopies: 'Esta semana',
      monthCopies: 'Este mes',
      reportsCopied: 'Informes copiados',
      phrasesCopied: 'Frases copiadas',
      aiUsage: 'Uso de IA',
      recordings: 'Grabaciones',
      reportsGenerated: 'Informes generados',
      chatQueries: 'Consultas de chat',
      interactionTime: 'Tiempo de interacción',
      hours: 'horas',
    },
    backup: {
      title: 'Gestión de Respaldos',
      createBackup: 'Crear respaldo',
      restoreBackup: 'Restaurar respaldo',
      exportData: 'Exportar datos',
      importData: 'Importar datos',
      backupCreated: 'Respaldo creado correctamente',
      backupRestored: 'Respaldo restaurado correctamente',
      selectFile: 'Seleccionar archivo',
      autoBackup: 'Respaldo automático',
      autoBackupEnabled: 'Respaldo automático activado',
      frequency: 'Frecuencia',
      days: 'días',
    },
    permissions: {
      microphoneTitle: 'Permiso de micrófono',
      microphoneMessage: 'Se requiere acceso al micrófono para grabar audio',
      cameraTitle: 'Permiso de cámara',
      cameraMessage: 'Se requiere acceso a la cámara para tomar fotos',
      storageTitle: 'Permiso de almacenamiento',
      storageMessage: 'Se requiere acceso al almacenamiento para guardar archivos',
      allow: 'Permitir',
      deny: 'Denegar',
    },
    errors: {
      generic: 'Ha ocurrido un error. Por favor, intenta de nuevo.',
      networkError: 'Error de conexión. Verifica tu conexión a internet.',
      authError: 'Error de autenticación. Inicia sesión nuevamente.',
      permissionDenied: 'Permiso denegado.',
      fileNotFound: 'Archivo no encontrado.',
      invalidData: 'Datos inválidos.',
    },
  },
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      copy: 'Copy',
      share: 'Share',
      search: 'Search',
      filter: 'Filter',
      confirm: 'Confirm',
      ok: 'OK',
      yes: 'Yes',
      no: 'No',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      clear: 'Clear',
      all: 'All',
      back: 'Back',
      next: 'Next',
      close: 'Close',
    },
    settings: {
      title: 'Settings',
      appearance: 'Appearance',
      theme: 'Theme',
      language: 'Language',
      lightMode: 'Light mode',
      darkMode: 'Dark mode',
      behavior: 'Behavior',
      favoritesFirst: 'Favorites first',
      favoritesFirstDescription: 'Show favorite reports at the top of the list',
      syncAndBackup: 'Sync and Backup',
      backupManagement: 'Backup Management',
      backupManagementDescription: 'Create, restore and manage data backups',
      myQRCode: 'My QR Code',
      myQRCodeDescription: 'Unique code to sync with other devices',
      information: 'Information',
      about: 'About RAD-IA',
      aboutDescription: 'Version and application information',
      version: 'Version',
      user: 'User',
      signIn: 'Sign in',
      signInDescription: 'Access with an existing account',
      createAccount: 'Create new account',
      createAccountDescription: 'Complete registration with professional information',
      signOut: 'Sign out',
      signOutDescription: 'Log out of your account',
      sharedItems: 'Shared items',
      sharedItemsDescription: 'received, sent',
      professionalInfo: 'Professional Information',
      dni: 'ID',
      location: 'Location',
      specialty: 'Specialty',
      selectLanguage: 'Select language',
    },
    reports: {
      title: 'PREF - Reports',
      noReports: 'No saved reports',
      noReportsDescription: 'Create your first medical report',
      createReport: 'Create Report',
      searchPlaceholder: 'Search reports...',
      filters: 'Filters',
      categories: 'Categories',
      activeFilters: 'active filters',
      noReportsFound: 'No reports found',
      noReportsFoundDescription: 'Try adjusting your search filters',
      titleLabel: 'Title',
      contentLabel: 'Content',
      saveReport: 'Save report',
      editReport: 'Edit report',
      deleteReport: 'Delete report',
      confirmDelete: 'Are you sure you want to delete this report?',
      reportDeleted: 'Report deleted',
      reportSaved: 'Report saved',
    },
    phrases: {
      title: 'Phrases',
      noPhrases: 'No saved phrases',
      noPhrasesDescription: 'Create your first common phrase',
      createPhrase: 'Create Phrase',
      searchPlaceholder: 'Search phrases...',
      filters: 'Filters',
      categories: 'Categories',
      textLabel: 'Text',
      savePhrase: 'Save phrase',
      editPhrase: 'Edit phrase',
      deletePhrase: 'Delete phrase',
      confirmDelete: 'Are you sure you want to delete this phrase?',
      phraseDeleted: 'Phrase deleted',
      phraseSaved: 'Phrase saved',
    },
    recording: {
      title: 'RAD-IA Report Generation',
      generating: 'Generating...',
      selectBaseReport: 'Base Report',
      noneSelected: 'None selected',
      searchReport: 'Search report...',
      record: 'Record',
      stop: 'Stop',
      newReport: 'New Report',
      transcribing: 'Transcribing automatically...',
      freeText: 'TEXT',
      outputLanguage: 'Output Language',
      createReport: 'Create Report',
      deleteLastText: 'Delete Last',
      deleteAllText: 'Delete All',
      confirmDeleteAll: 'Are you sure you want to delete all text?',
      findings: 'Findings',
      conclusion: 'Conclusion',
      differentials: 'Differentials',
      findingsPlaceholder: 'Findings will appear here...',
      conclusionPlaceholder: 'Conclusions will appear here...',
      differentialsPlaceholder: 'Differential diagnoses will appear here...',
    },
    dictaphone: {
      title: 'Dictaphone',
      subtitle: 'Record and transcribe audio in real time',
      iaMode: 'AI Mode',
      dictationMode: 'Dictation Mode',
      recording: 'Recording',
      processingTranscription: 'Processing and improving transcription...',
      useMicrophoneKeyboard: 'Use your keyboard microphone to dictate',
      typeOrUse: 'Type or use keyboard microphone...',
      save: 'Save',
      clear: 'Clear',
      recordings: 'Recordings',
      sendToIA: 'Send to AI',
      signInRequired: 'Sign in to access Dictaphone',
    },
    aiChat: {
      title: 'AI Chat',
      askAnything: 'Ask anything you need',
      placeholder: 'Type your message...',
      noMessages: 'No messages yet',
      noMessagesDescription: 'Start a conversation with the AI assistant',
      typingIndicator: 'Typing...',
    },
    productivity: {
      title: 'Productivity',
      totalCopies: 'Total copies',
      todayCopies: 'Today',
      weekCopies: 'This week',
      monthCopies: 'This month',
      reportsCopied: 'Reports copied',
      phrasesCopied: 'Phrases copied',
      aiUsage: 'AI Usage',
      recordings: 'Recordings',
      reportsGenerated: 'Reports generated',
      chatQueries: 'Chat queries',
      interactionTime: 'Interaction time',
      hours: 'hours',
    },
    backup: {
      title: 'Backup Management',
      createBackup: 'Create backup',
      restoreBackup: 'Restore backup',
      exportData: 'Export data',
      importData: 'Import data',
      backupCreated: 'Backup created successfully',
      backupRestored: 'Backup restored successfully',
      selectFile: 'Select file',
      autoBackup: 'Automatic backup',
      autoBackupEnabled: 'Automatic backup enabled',
      frequency: 'Frequency',
      days: 'days',
    },
    permissions: {
      microphoneTitle: 'Microphone permission',
      microphoneMessage: 'Microphone access is required to record audio',
      cameraTitle: 'Camera permission',
      cameraMessage: 'Camera access is required to take photos',
      storageTitle: 'Storage permission',
      storageMessage: 'Storage access is required to save files',
      allow: 'Allow',
      deny: 'Deny',
    },
    errors: {
      generic: 'An error has occurred. Please try again.',
      networkError: 'Connection error. Check your internet connection.',
      authError: 'Authentication error. Please sign in again.',
      permissionDenied: 'Permission denied.',
      fileNotFound: 'File not found.',
      invalidData: 'Invalid data.',
    },
  },
  de: {
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      copy: 'Kopieren',
      share: 'Teilen',
      search: 'Suchen',
      filter: 'Filtern',
      confirm: 'Bestätigen',
      ok: 'OK',
      yes: 'Ja',
      no: 'Nein',
      loading: 'Lädt...',
      error: 'Fehler',
      success: 'Erfolg',
      clear: 'Löschen',
      all: 'Alle',
      back: 'Zurück',
      next: 'Weiter',
      close: 'Schließen',
    },
    settings: {
      title: 'Einstellungen',
      appearance: 'Aussehen',
      theme: 'Thema',
      language: 'Sprache',
      lightMode: 'Heller Modus',
      darkMode: 'Dunkler Modus',
      behavior: 'Verhalten',
      favoritesFirst: 'Favoriten zuerst',
      favoritesFirstDescription: 'Favoritenberichte am Anfang der Liste anzeigen',
      syncAndBackup: 'Synchronisierung und Backup',
      backupManagement: 'Backup-Verwaltung',
      backupManagementDescription: 'Datensicherungen erstellen, wiederherstellen und verwalten',
      myQRCode: 'Mein QR-Code',
      myQRCodeDescription: 'Eindeutiger Code zur Synchronisierung mit anderen Geräten',
      information: 'Information',
      about: 'Über RAD-IA',
      aboutDescription: 'Versions- und Anwendungsinformationen',
      version: 'Version',
      user: 'Benutzer',
      signIn: 'Anmelden',
      signInDescription: 'Mit einem bestehenden Konto zugreifen',
      createAccount: 'Neues Konto erstellen',
      createAccountDescription: 'Vollständige Registrierung mit beruflichen Informationen',
      signOut: 'Abmelden',
      signOutDescription: 'Aus Ihrem Konto abmelden',
      sharedItems: 'Geteilte Elemente',
      sharedItemsDescription: 'empfangen, gesendet',
      professionalInfo: 'Berufliche Informationen',
      dni: 'Ausweis',
      location: 'Standort',
      specialty: 'Spezialität',
      selectLanguage: 'Sprache auswählen',
    },
    reports: {
      title: 'PREF - Berichte',
      noReports: 'Keine gespeicherten Berichte',
      noReportsDescription: 'Erstellen Sie Ihren ersten medizinischen Bericht',
      createReport: 'Bericht erstellen',
      searchPlaceholder: 'Berichte suchen...',
      filters: 'Filter',
      categories: 'Kategorien',
      activeFilters: 'aktive Filter',
      noReportsFound: 'Keine Berichte gefunden',
      noReportsFoundDescription: 'Versuchen Sie, Ihre Suchfilter anzupassen',
      titleLabel: 'Titel',
      contentLabel: 'Inhalt',
      saveReport: 'Bericht speichern',
      editReport: 'Bericht bearbeiten',
      deleteReport: 'Bericht löschen',
      confirmDelete: 'Sind Sie sicher, dass Sie diesen Bericht löschen möchten?',
      reportDeleted: 'Bericht gelöscht',
      reportSaved: 'Bericht gespeichert',
    },
    phrases: {
      title: 'Phrasen',
      noPhrases: 'Keine gespeicherten Phrasen',
      noPhrasesDescription: 'Erstellen Sie Ihre erste gängige Phrase',
      createPhrase: 'Phrase erstellen',
      searchPlaceholder: 'Phrasen suchen...',
      filters: 'Filter',
      categories: 'Kategorien',
      textLabel: 'Text',
      savePhrase: 'Phrase speichern',
      editPhrase: 'Phrase bearbeiten',
      deletePhrase: 'Phrase löschen',
      confirmDelete: 'Sind Sie sicher, dass Sie diese Phrase löschen möchten?',
      phraseDeleted: 'Phrase gelöscht',
      phraseSaved: 'Phrase gespeichert',
    },
    recording: {
      title: 'RAD-IA Berichtserstellung',
      generating: 'Generieren...',
      selectBaseReport: 'Basisbericht',
      noneSelected: 'Nichts ausgewählt',
      searchReport: 'Bericht suchen...',
      record: 'Aufnehmen',
      stop: 'Stoppen',
      newReport: 'Neuer Bericht',
      transcribing: 'Automatische Transkription...',
      freeText: 'TEXT',
      outputLanguage: 'Ausgabesprache',
      createReport: 'Bericht erstellen',
      deleteLastText: 'Letzten löschen',
      deleteAllText: 'Alles löschen',
      confirmDeleteAll: 'Sind Sie sicher, dass Sie den gesamten Text löschen möchten?',
      findings: 'Befunde',
      conclusion: 'Schlussfolgerung',
      differentials: 'Differenziale',
      findingsPlaceholder: 'Befunde werden hier erscheinen...',
      conclusionPlaceholder: 'Schlussfolgerungen werden hier erscheinen...',
      differentialsPlaceholder: 'Differentialdiagnosen werden hier erscheinen...',
    },
    dictaphone: {
      title: 'Diktiergerät',
      subtitle: 'Audio in Echtzeit aufnehmen und transkribieren',
      iaMode: 'KI-Modus',
      dictationMode: 'Diktiermodus',
      recording: 'Aufnahme',
      processingTranscription: 'Transkription wird verarbeitet und verbessert...',
      useMicrophoneKeyboard: 'Verwenden Sie das Tastatmikrofon zum Diktieren',
      typeOrUse: 'Tippen oder Tastatmikrofon verwenden...',
      save: 'Speichern',
      clear: 'Löschen',
      recordings: 'Aufnahmen',
      sendToIA: 'An KI senden',
      signInRequired: 'Melden Sie sich an, um auf das Diktiergerät zuzugreifen',
    },
    aiChat: {
      title: 'KI-Chat',
      askAnything: 'Fragen Sie alles, was Sie brauchen',
      placeholder: 'Ihre Nachricht eingeben...',
      noMessages: 'Noch keine Nachrichten',
      noMessagesDescription: 'Beginnen Sie ein Gespräch mit dem KI-Assistenten',
      typingIndicator: 'Schreibt...',
    },
    productivity: {
      title: 'Produktivität',
      totalCopies: 'Gesamtkopien',
      todayCopies: 'Heute',
      weekCopies: 'Diese Woche',
      monthCopies: 'Diesen Monat',
      reportsCopied: 'Berichte kopiert',
      phrasesCopied: 'Phrasen kopiert',
      aiUsage: 'KI-Nutzung',
      recordings: 'Aufnahmen',
      reportsGenerated: 'Generierte Berichte',
      chatQueries: 'Chat-Anfragen',
      interactionTime: 'Interaktionszeit',
      hours: 'Stunden',
    },
    backup: {
      title: 'Backup-Verwaltung',
      createBackup: 'Backup erstellen',
      restoreBackup: 'Backup wiederherstellen',
      exportData: 'Daten exportieren',
      importData: 'Daten importieren',
      backupCreated: 'Backup erfolgreich erstellt',
      backupRestored: 'Backup erfolgreich wiederhergestellt',
      selectFile: 'Datei auswählen',
      autoBackup: 'Automatisches Backup',
      autoBackupEnabled: 'Automatisches Backup aktiviert',
      frequency: 'Häufigkeit',
      days: 'Tage',
    },
    permissions: {
      microphoneTitle: 'Mikrofonberechtigung',
      microphoneMessage: 'Mikrofonzugriff ist erforderlich, um Audio aufzunehmen',
      cameraTitle: 'Kameraberechtigung',
      cameraMessage: 'Kamerazugriff ist erforderlich, um Fotos zu machen',
      storageTitle: 'Speicherberechtigung',
      storageMessage: 'Speicherzugriff ist erforderlich, um Dateien zu speichern',
      allow: 'Erlauben',
      deny: 'Verweigern',
    },
    errors: {
      generic: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      networkError: 'Verbindungsfehler. Überprüfen Sie Ihre Internetverbindung.',
      authError: 'Authentifizierungsfehler. Bitte melden Sie sich erneut an.',
      permissionDenied: 'Berechtigung verweigert.',
      fileNotFound: 'Datei nicht gefunden.',
      invalidData: 'Ungültige Daten.',
    },
  },
  fr: {
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      copy: 'Copier',
      share: 'Partager',
      search: 'Rechercher',
      filter: 'Filtrer',
      confirm: 'Confirmer',
      ok: 'OK',
      yes: 'Oui',
      no: 'Non',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      clear: 'Effacer',
      all: 'Tous',
      back: 'Retour',
      next: 'Suivant',
      close: 'Fermer',
    },
    settings: {
      title: 'Paramètres',
      appearance: 'Apparence',
      theme: 'Thème',
      language: 'Langue',
      lightMode: 'Mode clair',
      darkMode: 'Mode sombre',
      behavior: 'Comportement',
      favoritesFirst: 'Favoris en premier',
      favoritesFirstDescription: 'Afficher les rapports favoris en haut de la liste',
      syncAndBackup: 'Synchronisation et Sauvegarde',
      backupManagement: 'Gestion des Sauvegardes',
      backupManagementDescription: 'Créer, restaurer et gérer les sauvegardes de données',
      myQRCode: 'Mon Code QR',
      myQRCodeDescription: 'Code unique pour synchroniser avec d\'autres appareils',
      information: 'Information',
      about: 'À propos de RAD-IA',
      aboutDescription: 'Version et informations sur l\'application',
      version: 'Version',
      user: 'Utilisateur',
      signIn: 'Se connecter',
      signInDescription: 'Accéder avec un compte existant',
      createAccount: 'Créer un nouveau compte',
      createAccountDescription: 'Inscription complète avec informations professionnelles',
      signOut: 'Se déconnecter',
      signOutDescription: 'Déconnecter de votre compte',
      sharedItems: 'Éléments partagés',
      sharedItemsDescription: 'reçus, envoyés',
      professionalInfo: 'Informations Professionnelles',
      dni: 'Carte d\'identité',
      location: 'Emplacement',
      specialty: 'Spécialité',
      selectLanguage: 'Sélectionner la langue',
    },
    reports: {
      title: 'PREF - Rapports',
      noReports: 'Aucun rapport enregistré',
      noReportsDescription: 'Créez votre premier rapport médical',
      createReport: 'Créer un Rapport',
      searchPlaceholder: 'Rechercher des rapports...',
      filters: 'Filtres',
      categories: 'Catégories',
      activeFilters: 'filtres actifs',
      noReportsFound: 'Aucun rapport trouvé',
      noReportsFoundDescription: 'Essayez d\'ajuster vos filtres de recherche',
      titleLabel: 'Titre',
      contentLabel: 'Contenu',
      saveReport: 'Enregistrer le rapport',
      editReport: 'Modifier le rapport',
      deleteReport: 'Supprimer le rapport',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce rapport?',
      reportDeleted: 'Rapport supprimé',
      reportSaved: 'Rapport enregistré',
    },
    phrases: {
      title: 'Phrases',
      noPhrases: 'Aucune phrase enregistrée',
      noPhrasesDescription: 'Créez votre première phrase courante',
      createPhrase: 'Créer une Phrase',
      searchPlaceholder: 'Rechercher des phrases...',
      filters: 'Filtres',
      categories: 'Catégories',
      textLabel: 'Texte',
      savePhrase: 'Enregistrer la phrase',
      editPhrase: 'Modifier la phrase',
      deletePhrase: 'Supprimer la phrase',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette phrase?',
      phraseDeleted: 'Phrase supprimée',
      phraseSaved: 'Phrase enregistrée',
    },
    recording: {
      title: 'Génération de Rapports RAD-IA',
      generating: 'Génération...',
      selectBaseReport: 'Rapport de Base',
      noneSelected: 'Aucune sélection',
      searchReport: 'Rechercher un rapport...',
      record: 'Enregistrer',
      stop: 'Arrêter',
      newReport: 'Nouveau Rapport',
      transcribing: 'Transcription automatique...',
      freeText: 'TEXTE',
      outputLanguage: 'Langue de Sortie',
      createReport: 'Créer un Rapport',
      deleteLastText: 'Supprimer le Dernier',
      deleteAllText: 'Tout Supprimer',
      confirmDeleteAll: 'Êtes-vous sûr de vouloir supprimer tout le texte?',
      findings: 'Constatations',
      conclusion: 'Conclusion',
      differentials: 'Différentiels',
      findingsPlaceholder: 'Les constatations apparaîtront ici...',
      conclusionPlaceholder: 'Les conclusions apparaîtront ici...',
      differentialsPlaceholder: 'Les diagnostics différentiels apparaîtront ici...',
    },
    dictaphone: {
      title: 'Dictaphone',
      subtitle: 'Enregistrer et transcrire l\'audio en temps réel',
      iaMode: 'Mode IA',
      dictationMode: 'Mode Dictée',
      recording: 'Enregistrement',
      processingTranscription: 'Traitement et amélioration de la transcription...',
      useMicrophoneKeyboard: 'Utilisez le microphone de votre clavier pour dicter',
      typeOrUse: 'Tapez ou utilisez le microphone du clavier...',
      save: 'Enregistrer',
      clear: 'Effacer',
      recordings: 'Enregistrements',
      sendToIA: 'Envoyer à l\'IA',
      signInRequired: 'Connectez-vous pour accéder au Dictaphone',
    },
    aiChat: {
      title: 'Chat IA',
      askAnything: 'Demandez tout ce dont vous avez besoin',
      placeholder: 'Tapez votre message...',
      noMessages: 'Aucun message pour le moment',
      noMessagesDescription: 'Commencez une conversation avec l\'assistant IA',
      typingIndicator: 'Écriture...',
    },
    productivity: {
      title: 'Productivité',
      totalCopies: 'Copies totales',
      todayCopies: 'Aujourd\'hui',
      weekCopies: 'Cette semaine',
      monthCopies: 'Ce mois-ci',
      reportsCopied: 'Rapports copiés',
      phrasesCopied: 'Phrases copiées',
      aiUsage: 'Utilisation de l\'IA',
      recordings: 'Enregistrements',
      reportsGenerated: 'Rapports générés',
      chatQueries: 'Requêtes de chat',
      interactionTime: 'Temps d\'interaction',
      hours: 'heures',
    },
    backup: {
      title: 'Gestion des Sauvegardes',
      createBackup: 'Créer une sauvegarde',
      restoreBackup: 'Restaurer une sauvegarde',
      exportData: 'Exporter les données',
      importData: 'Importer les données',
      backupCreated: 'Sauvegarde créée avec succès',
      backupRestored: 'Sauvegarde restaurée avec succès',
      selectFile: 'Sélectionner un fichier',
      autoBackup: 'Sauvegarde automatique',
      autoBackupEnabled: 'Sauvegarde automatique activée',
      frequency: 'Fréquence',
      days: 'jours',
    },
    permissions: {
      microphoneTitle: 'Permission microphone',
      microphoneMessage: 'L\'accès au microphone est requis pour enregistrer de l\'audio',
      cameraTitle: 'Permission caméra',
      cameraMessage: 'L\'accès à la caméra est requis pour prendre des photos',
      storageTitle: 'Permission de stockage',
      storageMessage: 'L\'accès au stockage est requis pour enregistrer des fichiers',
      allow: 'Autoriser',
      deny: 'Refuser',
    },
    errors: {
      generic: 'Une erreur s\'est produite. Veuillez réessayer.',
      networkError: 'Erreur de connexion. Vérifiez votre connexion Internet.',
      authError: 'Erreur d\'authentification. Veuillez vous reconnecter.',
      permissionDenied: 'Permission refusée.',
      fileNotFound: 'Fichier introuvable.',
      invalidData: 'Données invalides.',
    },
  },
  pt: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      copy: 'Copiar',
      share: 'Compartilhar',
      search: 'Buscar',
      filter: 'Filtrar',
      confirm: 'Confirmar',
      ok: 'OK',
      yes: 'Sim',
      no: 'Não',
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      clear: 'Limpar',
      all: 'Todos',
      back: 'Voltar',
      next: 'Próximo',
      close: 'Fechar',
    },
    settings: {
      title: 'Configurações',
      appearance: 'Aparência',
      theme: 'Tema',
      language: 'Idioma',
      lightMode: 'Modo claro',
      darkMode: 'Modo escuro',
      behavior: 'Comportamento',
      favoritesFirst: 'Favoritos primeiro',
      favoritesFirstDescription: 'Mostrar relatórios favoritos no topo da lista',
      syncAndBackup: 'Sincronização e Backup',
      backupManagement: 'Gerenciamento de Backups',
      backupManagementDescription: 'Criar, restaurar e gerenciar backups de dados',
      myQRCode: 'Meu Código QR',
      myQRCodeDescription: 'Código único para sincronizar com outros dispositivos',
      information: 'Informação',
      about: 'Sobre RAD-IA',
      aboutDescription: 'Versão e informações do aplicativo',
      version: 'Versão',
      user: 'Usuário',
      signIn: 'Entrar',
      signInDescription: 'Acessar com uma conta existente',
      createAccount: 'Criar nova conta',
      createAccountDescription: 'Registro completo com informações profissionais',
      signOut: 'Sair',
      signOutDescription: 'Desconectar da sua conta',
      sharedItems: 'Itens compartilhados',
      sharedItemsDescription: 'recebidos, enviados',
      professionalInfo: 'Informações Profissionais',
      dni: 'Documento',
      location: 'Localização',
      specialty: 'Especialidade',
      selectLanguage: 'Selecionar idioma',
    },
    reports: {
      title: 'PREF - Relatórios',
      noReports: 'Nenhum relatório salvo',
      noReportsDescription: 'Crie seu primeiro relatório médico',
      createReport: 'Criar Relatório',
      searchPlaceholder: 'Buscar relatórios...',
      filters: 'Filtros',
      categories: 'Categorias',
      activeFilters: 'filtros ativos',
      noReportsFound: 'Nenhum relatório encontrado',
      noReportsFoundDescription: 'Tente ajustar seus filtros de busca',
      titleLabel: 'Título',
      contentLabel: 'Conteúdo',
      saveReport: 'Salvar relatório',
      editReport: 'Editar relatório',
      deleteReport: 'Excluir relatório',
      confirmDelete: 'Tem certeza de que deseja excluir este relatório?',
      reportDeleted: 'Relatório excluído',
      reportSaved: 'Relatório salvo',
    },
    phrases: {
      title: 'Frases',
      noPhrases: 'Nenhuma frase salva',
      noPhrasesDescription: 'Crie sua primeira frase comum',
      createPhrase: 'Criar Frase',
      searchPlaceholder: 'Buscar frases...',
      filters: 'Filtros',
      categories: 'Categorias',
      textLabel: 'Texto',
      savePhrase: 'Salvar frase',
      editPhrase: 'Editar frase',
      deletePhrase: 'Excluir frase',
      confirmDelete: 'Tem certeza de que deseja excluir esta frase?',
      phraseDeleted: 'Frase excluída',
      phraseSaved: 'Frase salva',
    },
    recording: {
      title: 'Geração de Relatórios RAD-IA',
      generating: 'Gerando...',
      selectBaseReport: 'Relatório Base',
      noneSelected: 'Nenhum selecionado',
      searchReport: 'Buscar relatório...',
      record: 'Gravar',
      stop: 'Parar',
      newReport: 'Novo Relatório',
      transcribing: 'Transcrevendo automaticamente...',
      freeText: 'TEXTO',
      outputLanguage: 'Idioma de Saída',
      createReport: 'Criar Relatório',
      deleteLastText: 'Excluir Último',
      deleteAllText: 'Excluir Tudo',
      confirmDeleteAll: 'Tem certeza de que deseja excluir todo o texto?',
      findings: 'Achados',
      conclusion: 'Conclusão',
      differentials: 'Diferenciais',
      findingsPlaceholder: 'Os achados aparecerão aqui...',
      conclusionPlaceholder: 'As conclusões aparecerão aqui...',
      differentialsPlaceholder: 'Os diagnósticos diferenciais aparecerão aqui...',
    },
    dictaphone: {
      title: 'Ditafone',
      subtitle: 'Gravar e transcrever áudio em tempo real',
      iaMode: 'Modo IA',
      dictationMode: 'Modo Ditado',
      recording: 'Gravando',
      processingTranscription: 'Processando e melhorando transcrição...',
      useMicrophoneKeyboard: 'Use o microfone do teclado para ditar',
      typeOrUse: 'Digite ou use o microfone do teclado...',
      save: 'Salvar',
      clear: 'Limpar',
      recordings: 'Gravações',
      sendToIA: 'Enviar para IA',
      signInRequired: 'Entre para acessar o Ditafone',
    },
    aiChat: {
      title: 'Chat IA',
      askAnything: 'Pergunte o que precisar',
      placeholder: 'Digite sua mensagem...',
      noMessages: 'Ainda sem mensagens',
      noMessagesDescription: 'Inicie uma conversa com o assistente IA',
      typingIndicator: 'Digitando...',
    },
    productivity: {
      title: 'Produtividade',
      totalCopies: 'Cópias totais',
      todayCopies: 'Hoje',
      weekCopies: 'Esta semana',
      monthCopies: 'Este mês',
      reportsCopied: 'Relatórios copiados',
      phrasesCopied: 'Frases copiadas',
      aiUsage: 'Uso de IA',
      recordings: 'Gravações',
      reportsGenerated: 'Relatórios gerados',
      chatQueries: 'Consultas de chat',
      interactionTime: 'Tempo de interação',
      hours: 'horas',
    },
    backup: {
      title: 'Gerenciamento de Backups',
      createBackup: 'Criar backup',
      restoreBackup: 'Restaurar backup',
      exportData: 'Exportar dados',
      importData: 'Importar dados',
      backupCreated: 'Backup criado com sucesso',
      backupRestored: 'Backup restaurado com sucesso',
      selectFile: 'Selecionar arquivo',
      autoBackup: 'Backup automático',
      autoBackupEnabled: 'Backup automático ativado',
      frequency: 'Frequência',
      days: 'dias',
    },
    permissions: {
      microphoneTitle: 'Permissão de microfone',
      microphoneMessage: 'O acesso ao microfone é necessário para gravar áudio',
      cameraTitle: 'Permissão de câmera',
      cameraMessage: 'O acesso à câmera é necessário para tirar fotos',
      storageTitle: 'Permissão de armazenamento',
      storageMessage: 'O acesso ao armazenamento é necessário para salvar arquivos',
      allow: 'Permitir',
      deny: 'Negar',
    },
    errors: {
      generic: 'Ocorreu um erro. Por favor, tente novamente.',
      networkError: 'Erro de conexão. Verifique sua conexão com a internet.',
      authError: 'Erro de autenticação. Por favor, entre novamente.',
      permissionDenied: 'Permissão negada.',
      fileNotFound: 'Arquivo não encontrado.',
      invalidData: 'Dados inválidos.',
    },
  },
  it: {
    common: {
      save: 'Salva',
      cancel: 'Annulla',
      delete: 'Elimina',
      edit: 'Modifica',
      copy: 'Copia',
      share: 'Condividi',
      search: 'Cerca',
      filter: 'Filtra',
      confirm: 'Conferma',
      ok: 'OK',
      yes: 'Sì',
      no: 'No',
      loading: 'Caricamento...',
      error: 'Errore',
      success: 'Successo',
      clear: 'Cancella',
      all: 'Tutti',
      back: 'Indietro',
      next: 'Avanti',
      close: 'Chiudi',
    },
    settings: {
      title: 'Impostazioni',
      appearance: 'Aspetto',
      theme: 'Tema',
      language: 'Lingua',
      lightMode: 'Modalità chiara',
      darkMode: 'Modalità scura',
      behavior: 'Comportamento',
      favoritesFirst: 'Preferiti per primi',
      favoritesFirstDescription: 'Mostra i report preferiti in cima alla lista',
      syncAndBackup: 'Sincronizzazione e Backup',
      backupManagement: 'Gestione Backup',
      backupManagementDescription: 'Creare, ripristinare e gestire i backup dei dati',
      myQRCode: 'Il Mio Codice QR',
      myQRCodeDescription: 'Codice unico per sincronizzare con altri dispositivi',
      information: 'Informazioni',
      about: 'Informazioni su RAD-IA',
      aboutDescription: 'Versione e informazioni sull\'applicazione',
      version: 'Versione',
      user: 'Utente',
      signIn: 'Accedi',
      signInDescription: 'Accedi con un account esistente',
      createAccount: 'Crea nuovo account',
      createAccountDescription: 'Registrazione completa con informazioni professionali',
      signOut: 'Esci',
      signOutDescription: 'Disconnettiti dal tuo account',
      sharedItems: 'Elementi condivisi',
      sharedItemsDescription: 'ricevuti, inviati',
      professionalInfo: 'Informazioni Professionali',
      dni: 'Documento',
      location: 'Posizione',
      specialty: 'Specialità',
      selectLanguage: 'Seleziona lingua',
    },
    reports: {
      title: 'PREF - Rapporti',
      noReports: 'Nessun rapporto salvato',
      noReportsDescription: 'Crea il tuo primo rapporto medico',
      createReport: 'Crea Rapporto',
      searchPlaceholder: 'Cerca rapporti...',
      filters: 'Filtri',
      categories: 'Categorie',
      activeFilters: 'filtri attivi',
      noReportsFound: 'Nessun rapporto trovato',
      noReportsFoundDescription: 'Prova ad aggiustare i filtri di ricerca',
      titleLabel: 'Titolo',
      contentLabel: 'Contenuto',
      saveReport: 'Salva rapporto',
      editReport: 'Modifica rapporto',
      deleteReport: 'Elimina rapporto',
      confirmDelete: 'Sei sicuro di voler eliminare questo rapporto?',
      reportDeleted: 'Rapporto eliminato',
      reportSaved: 'Rapporto salvato',
    },
    phrases: {
      title: 'Frasi',
      noPhrases: 'Nessuna frase salvata',
      noPhrasesDescription: 'Crea la tua prima frase comune',
      createPhrase: 'Crea Frase',
      searchPlaceholder: 'Cerca frasi...',
      filters: 'Filtri',
      categories: 'Categorie',
      textLabel: 'Testo',
      savePhrase: 'Salva frase',
      editPhrase: 'Modifica frase',
      deletePhrase: 'Elimina frase',
      confirmDelete: 'Sei sicuro di voler eliminare questa frase?',
      phraseDeleted: 'Frase eliminata',
      phraseSaved: 'Frase salvata',
    },
    recording: {
      title: 'Generazione Rapporti RAD-IA',
      generating: 'Generazione...',
      selectBaseReport: 'Rapporto Base',
      noneSelected: 'Nessuno selezionato',
      searchReport: 'Cerca rapporto...',
      record: 'Registra',
      stop: 'Ferma',
      newReport: 'Nuovo Rapporto',
      transcribing: 'Trascrizione automatica...',
      freeText: 'TESTO',
      outputLanguage: 'Lingua di Uscita',
      createReport: 'Crea Rapporto',
      deleteLastText: 'Elimina Ultimo',
      deleteAllText: 'Elimina Tutto',
      confirmDeleteAll: 'Sei sicuro di voler eliminare tutto il testo?',
      findings: 'Risultati',
      conclusion: 'Conclusione',
      differentials: 'Differenziali',
      findingsPlaceholder: 'I risultati appariranno qui...',
      conclusionPlaceholder: 'Le conclusioni appariranno qui...',
      differentialsPlaceholder: 'Le diagnosi differenziali appariranno qui...',
    },
    dictaphone: {
      title: 'Dittafono',
      subtitle: 'Registra e trascrivi audio in tempo reale',
      iaMode: 'Modalità IA',
      dictationMode: 'Modalità Dettatura',
      recording: 'Registrazione',
      processingTranscription: 'Elaborazione e miglioramento della trascrizione...',
      useMicrophoneKeyboard: 'Usa il microfono della tastiera per dettare',
      typeOrUse: 'Digita o usa il microfono della tastiera...',
      save: 'Salva',
      clear: 'Cancella',
      recordings: 'Registrazioni',
      sendToIA: 'Invia all\'IA',
      signInRequired: 'Accedi per utilizzare il Dittafono',
    },
    aiChat: {
      title: 'Chat IA',
      askAnything: 'Chiedi tutto ciò di cui hai bisogno',
      placeholder: 'Scrivi il tuo messaggio...',
      noMessages: 'Ancora nessun messaggio',
      noMessagesDescription: 'Inizia una conversazione con l\'assistente IA',
      typingIndicator: 'Sta scrivendo...',
    },
    productivity: {
      title: 'Produttività',
      totalCopies: 'Copie totali',
      todayCopies: 'Oggi',
      weekCopies: 'Questa settimana',
      monthCopies: 'Questo mese',
      reportsCopied: 'Rapporti copiati',
      phrasesCopied: 'Frasi copiate',
      aiUsage: 'Utilizzo IA',
      recordings: 'Registrazioni',
      reportsGenerated: 'Rapporti generati',
      chatQueries: 'Query di chat',
      interactionTime: 'Tempo di interazione',
      hours: 'ore',
    },
    backup: {
      title: 'Gestione Backup',
      createBackup: 'Crea backup',
      restoreBackup: 'Ripristina backup',
      exportData: 'Esporta dati',
      importData: 'Importa dati',
      backupCreated: 'Backup creato con successo',
      backupRestored: 'Backup ripristinato con successo',
      selectFile: 'Seleziona file',
      autoBackup: 'Backup automatico',
      autoBackupEnabled: 'Backup automatico attivato',
      frequency: 'Frequenza',
      days: 'giorni',
    },
    permissions: {
      microphoneTitle: 'Permesso microfono',
      microphoneMessage: 'L\'accesso al microfono è necessario per registrare audio',
      cameraTitle: 'Permesso fotocamera',
      cameraMessage: 'L\'accesso alla fotocamera è necessario per scattare foto',
      storageTitle: 'Permesso archiviazione',
      storageMessage: 'L\'accesso all\'archiviazione è necessario per salvare file',
      allow: 'Consenti',
      deny: 'Nega',
    },
    errors: {
      generic: 'Si è verificato un errore. Riprova.',
      networkError: 'Errore di connessione. Controlla la tua connessione internet.',
      authError: 'Errore di autenticazione. Accedi di nuovo.',
      permissionDenied: 'Permesso negato.',
      fileNotFound: 'File non trovato.',
      invalidData: 'Dati non validi.',
    },
  },
};

export const languageNames: Record<Language, string> = {
  es: 'Español',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  pt: 'Português',
  it: 'Italiano',
};
