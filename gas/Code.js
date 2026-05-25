const HEADERS = [
  "ID",
  "Drive_File_ID",
  "Title",
  "Description",
  "Tags",
  "Category",
  "Privacy",
  "Schedule",
  "Status",
  "YouTube_URL",
  "Error",
  "Created_At",
  "Updated_At",
  "Retry_Count",
];
const MAX_RETRY_COUNT = 3;

function setup() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty("GAS_WEBHOOK_SECRET")) {
    properties.setProperty("GAS_WEBHOOK_SECRET", Utilities.getUuid() + Utilities.getUuid());
  }

  const sheet = getSheet_();
  ensureHeaders_(sheet);
  installHourlyTrigger();

  return {
    spreadsheetId: properties.getProperty("SPREADSHEET_ID"),
    webhookSecret: properties.getProperty("GAS_WEBHOOK_SECRET"),
  };
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    assertSecret_(e);
    const item = validatePayload_(payload);
    const sheet = getSheet_();
    ensureHeaders_(sheet);
    const now = new Date().toISOString();
    const id = Utilities.getUuid();

    sheet.appendRow([
      id,
      item.driveFileId,
      item.title,
      item.description,
      item.tags,
      item.category,
      item.privacy,
      item.schedule,
      "Pending",
      "",
      "",
      now,
      now,
      0,
    ]);

    return json_({ ok: true, id });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: publicError_(error) });
  }
}

function doGet(e) {
  try {
    assertSecret_(e);
    const sheet = getSheet_();
    ensureHeaders_(sheet);
    const rows = sheet.getDataRange().getValues().slice(1);
    const items = rows.filter((row) => row[0]).map(rowToItem_).reverse();
    return json_({ ok: true, items });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: publicError_(error) });
  }
}

function processQueue() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
  const sheet = getSheet_();
  ensureHeaders_(sheet);
  const values = sheet.getDataRange().getValues();
  const now = new Date();

  for (let index = 1; index < values.length; index += 1) {
    const row = values[index];
    const item = rowToItem_(row);
    if (item.status !== "Pending") continue;
    if (Number(item.retryCount || 0) >= MAX_RETRY_COUNT) continue;
    const scheduledAt = parseSchedule_(item.schedule);
    if (scheduledAt > now) continue;

    const rowNumber = index + 1;
    updateRow_(sheet, rowNumber, { Status: "Uploading", Error: "" });

    try {
      const url = uploadToYouTube_(item);
      updateRow_(sheet, rowNumber, { Status: "Success", YouTube_URL: url, Error: "" });
    } catch (error) {
      const retryCount = Number(item.retryCount || 0) + 1;
      updateRow_(sheet, rowNumber, { Status: retryCount >= MAX_RETRY_COUNT ? "Failed" : "Pending", Retry_Count: retryCount, Error: error.message });
    }
  }
  } finally {
    lock.releaseLock();
  }
}

function installHourlyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "processQueue")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger("processQueue").timeBased().everyHours(1).create();
}

function uploadToYouTube_(item) {
  const file = DriveApp.getFileById(item.driveFileId);
  const resource = {
    snippet: {
      title: item.title,
      description: item.description,
      tags: item.tags ? item.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      categoryId: String(item.category || "22"),
    },
    status: {
      privacyStatus: item.privacy || "private",
      selfDeclaredMadeForKids: false,
    },
  };

  const response = YouTube.Videos.insert(resource, "snippet,status", file.getBlob());
  return `https://www.youtube.com/watch?v=${response.id}`;
}

function getSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Missing SPREADSHEET_ID script property");
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  return spreadsheet.getSheetByName("Queue") || spreadsheet.insertSheet("Queue");
}

function ensureHeaders_(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (firstRow.join("") === "") sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

function validatePayload_(payload) {
  const item = {
    driveFileId: String(payload.driveFileId || "").trim(),
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim(),
    tags: String(payload.tags || "").trim(),
    category: String(payload.category || "22").trim(),
    privacy: String(payload.privacy || "private").trim(),
    schedule: normalizeSchedule_(String(payload.schedule || "").trim()),
  };
  if (!item.driveFileId) throw new Error("Drive File ID wajib diisi");
  if (!item.title) throw new Error("Judul wajib diisi");
  if (!item.schedule) throw new Error("Jadwal wajib diisi");
  if (Number.isNaN(parseSchedule_(item.schedule).getTime())) throw new Error("Jadwal invalid");
  if (!/^[-\w]{10,200}$/.test(item.driveFileId)) throw new Error("Drive File ID invalid");
  if (item.description.length > 5000) throw new Error("Deskripsi terlalu panjang");
  if (item.tags.length > 500) throw new Error("Tags terlalu panjang");
  if (!/^[0-9]{1,3}$/.test(item.category)) throw new Error("Kategori invalid");
  if (!["private", "unlisted", "public"].includes(item.privacy)) throw new Error("Privacy invalid");
  return item;
}

function normalizeSchedule_(schedule) {
  if (!schedule) return "";
  const parsed = parseSchedule_(schedule);
  if (Number.isNaN(parsed.getTime())) return schedule;
  return parsed.toISOString();
}

function parseSchedule_(schedule) {
  if (schedule instanceof Date) return schedule;
  return new Date(String(schedule));
}

function assertSecret_(e) {
  const expected = PropertiesService.getScriptProperties().getProperty("GAS_WEBHOOK_SECRET");
  const headers = (e && e.headers) || {};
  const provided = headers["x-gas-secret"] || headers["X-Gas-Secret"];
  if (!expected) throw new Error("Missing GAS_WEBHOOK_SECRET script property");
  if (provided !== expected) throw new Error("Unauthorized");
}

function rowToItem_(row) {
  return {
    id: row[0],
    driveFileId: row[1],
    title: row[2],
    description: row[3],
    tags: row[4],
    category: row[5],
    privacy: row[6],
    schedule: row[7],
    status: row[8],
    youtubeUrl: row[9],
    error: row[10],
    createdAt: row[11],
    updatedAt: row[12],
    retryCount: row[13],
  };
}

function publicError_(error) {
  const message = error && error.message ? error.message : "Request failed";
  return message === "Unauthorized" || message.indexOf("wajib") >= 0 || message.indexOf("invalid") >= 0 || message.indexOf("panjang") >= 0 ? message : "Request failed";
}

function updateRow_(sheet, rowNumber, patch) {
  Object.keys(patch).forEach((key) => {
    const col = HEADERS.indexOf(key) + 1;
    if (col > 0) sheet.getRange(rowNumber, col).setValue(patch[key]);
  });
  sheet.getRange(rowNumber, HEADERS.indexOf("Updated_At") + 1).setValue(new Date().toISOString());
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
