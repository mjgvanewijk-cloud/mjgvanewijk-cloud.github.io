// scripts/core/state/test-license-gate.js
import { loadSettings, saveSettings } from "../storage.js";
import { t } from "../../i18n.js";

/**
 * Device-bound testlicentie gate (offline challenge–response).
 *
 * - Toon "Activatie-ID" (deviceId) wanneer niet geactiveerd.
 * - Activatiecode bevat deviceId + exp + signature.
 * - Code werkt alleen op dit toestel.
 * - Bij geldige code: start direct in Premium.
 *
 * Niets aan bestaande UI/undo/nav/help aanpassen: deze gate draait vóór de app init.
 */

const SECRET = "FF_TEST_SECRET_V1_CHANGE_ME";
const DEVICE_ID_KEY = "finflow_device_id_v1";

function nowMs() { return Date.now(); }

function getOrCreateDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && typeof existing === "string" && existing.length >= 16) return existing;
  } catch {}

  // UUIDv4-ish (zonder externe libs)
  const bytes = new Uint8Array(16);
  try { crypto.getRandomValues(bytes); } catch { for (let i=0;i<16;i++) bytes[i] = Math.floor(Math.random()*256); }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2,"0")).join("");
  const uuid = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;

  try { localStorage.setItem(DEVICE_ID_KEY, uuid); } catch {}
  return uuid;
}

function base64UrlEncode(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64UrlDecodeToString(b64url) {
  const b64 = b64url.replace(/-/g,'+').replace(/_/g,'/');
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return decodeURIComponent(escape(String.fromCharCode(...bytes)));
}

function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
function sha256(bytes) {
  const K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ]);
  const H = new Uint32Array([
    0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
    0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19
  ]);
  const l = bytes.length;
  const bitLenHi = Math.floor((l * 8) / 0x100000000);
  const bitLenLo = (l * 8) >>> 0;

  const withOne = new Uint8Array(l + 1);
  withOne.set(bytes, 0); withOne[l] = 0x80;

  let paddedLen = withOne.length;
  while ((paddedLen % 64) !== 56) paddedLen++;
  const padded = new Uint8Array(paddedLen + 8);
  padded.set(withOne, 0);

  padded[paddedLen+0]=(bitLenHi>>>24)&0xff; padded[paddedLen+1]=(bitLenHi>>>16)&0xff;
  padded[paddedLen+2]=(bitLenHi>>>8)&0xff;  padded[paddedLen+3]=(bitLenHi>>>0)&0xff;
  padded[paddedLen+4]=(bitLenLo>>>24)&0xff; padded[paddedLen+5]=(bitLenLo>>>16)&0xff;
  padded[paddedLen+6]=(bitLenLo>>>8)&0xff;  padded[paddedLen+7]=(bitLenLo>>>0)&0xff;

  const W = new Uint32Array(64);

  for (let i=0;i<padded.length;i+=64){
    for (let t=0;t<16;t++){
      const j=i+t*4;
      W[t]=((padded[j]<<24)|(padded[j+1]<<16)|(padded[j+2]<<8)|(padded[j+3]))>>>0;
    }
    for (let t=16;t<64;t++){
      const s0=(rotr(7,W[t-15])^rotr(18,W[t-15])^(W[t-15]>>>3))>>>0;
      const s1=(rotr(17,W[t-2])^rotr(19,W[t-2])^(W[t-2]>>>10))>>>0;
      W[t]=(W[t-16]+s0+W[t-7]+s1)>>>0;
    }

    let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for (let t=0;t<64;t++){
      const S1=(rotr(6,e)^rotr(11,e)^rotr(25,e))>>>0;
      const ch=((e&f)^(~e&g))>>>0;
      const temp1=(h+S1+ch+K[t]+W[t])>>>0;
      const S0=(rotr(2,a)^rotr(13,a)^rotr(22,a))>>>0;
      const maj=((a&b)^(a&c)^(b&c))>>>0;
      const temp2=(S0+maj)>>>0;

      h=g; g=f; f=e; e=(d+temp1)>>>0;
      d=c; c=b; b=a; a=(temp1+temp2)>>>0;
    }
    H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
    H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
  }

  const out=new Uint8Array(32);
  for (let i=0;i<8;i++){
    out[i*4+0]=(H[i]>>>24)&0xff;
    out[i*4+1]=(H[i]>>>16)&0xff;
    out[i*4+2]=(H[i]>>>8)&0xff;
    out[i*4+3]=(H[i]>>>0)&0xff;
  }
  return out;
}

function hmacSha256(keyBytes, msgBytes) {
  const blockSize=64;
  let k=keyBytes;
  if (k.length>blockSize) k=sha256(k);
  const oKeyPad=new Uint8Array(blockSize); oKeyPad.fill(0x5c);
  const iKeyPad=new Uint8Array(blockSize); iKeyPad.fill(0x36);
  for (let i=0;i<k.length;i++){ oKeyPad[i]^=k[i]; iKeyPad[i]^=k[i]; }
  const inner=new Uint8Array(iKeyPad.length+msgBytes.length);
  inner.set(iKeyPad,0); inner.set(msgBytes,iKeyPad.length);
  const innerHash=sha256(inner);
  const outer=new Uint8Array(oKeyPad.length+innerHash.length);
  outer.set(oKeyPad,0); outer.set(innerHash,oKeyPad.length);
  return sha256(outer);
}

function hmacSha256Base64Url(messageB64Url) {
  const enc = new TextEncoder();
  const keyBytes = enc.encode(SECRET);
  const msgBytes = enc.encode(messageB64Url);
  const sigBytes = hmacSha256(keyBytes, msgBytes);
  let binary="";
  for (let i=0;i<sigBytes.length;i++) binary += String.fromCharCode(sigBytes[i]);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function verifyToken(token, expectedDeviceId) {
  if (!token || typeof token !== "string") return { ok:false, err:"invalid" };
  const parts = token.trim().split(".");
  if (parts.length !== 2) return { ok:false, err:"invalid" };
  const [payloadB64Url, sigB64Url] = parts;
  const expectedSig = hmacSha256Base64Url(payloadB64Url);
  if (sigB64Url !== expectedSig) return { ok:false, err:"invalid" };

  let payload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(payloadB64Url));
  } catch {
    return { ok:false, err:"invalid" };
  }

  const exp = Number(payload.exp);
  if (!exp || !isFinite(exp)) return { ok:false, err:"invalid" };
  if (nowMs() > exp) return { ok:false, err:"expired" };

  const deviceId = String(payload.deviceId || "");
  if (!deviceId || deviceId !== expectedDeviceId) return { ok:false, err:"device" };

  return { ok:true, payload };
}

function ensurePremiumOn(settings) {
  if (!settings || typeof settings !== "object") settings = {};
  if (!settings.premium || typeof settings.premium !== "object") {
    settings.premium = { active: false, trialStart: null, trialUsed: false };
  }
  settings.premium.active = true;
  settings.premium.trialStart = null;
  settings.premium.trialUsed = true;
  settings.isPremium = true;
  return settings;
}

function removeGateOverlayIfAny() {
  const existing = document.getElementById("ffTestGateOverlay");
  if (existing) existing.remove();
}

function showGateOverlay(deviceId, initialErrorKey) {
  removeGateOverlayIfAny();

  const overlay = document.createElement("div");
  overlay.id = "ffTestGateOverlay";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "999999";
  overlay.style.background = "rgba(0,0,0,.65)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "16px";

  const card = document.createElement("div");
  card.style.width = "min(520px, 100%)";
  card.style.background = "rgba(28,28,30,.98)";
  card.style.border = "1px solid rgba(255,255,255,.12)";
  card.style.borderRadius = "18px";
  card.style.boxShadow = "0 18px 40px rgba(0,0,0,.4)";
  card.style.padding = "18px";
  card.style.color = "#fff";
  card.style.fontFamily = "-apple-system, system-ui, Segoe UI, Roboto, Arial";

  const title = document.createElement("div");
  title.style.fontSize = "18px";
  title.style.fontWeight = "800";
  title.style.marginBottom = "8px";
  title.textContent = t("license.activate.title");

  const instr = document.createElement("div");
  instr.style.fontSize = "13px";
  instr.style.opacity = ".85";
  instr.style.lineHeight = "1.35";
  instr.style.marginBottom = "12px";
  instr.textContent = t("license.activate.instructions");

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "10px";
  row.style.alignItems = "flex-end";
  row.style.flexWrap = "wrap";
  row.style.marginBottom = "12px";

  const didWrap = document.createElement("div");
  didWrap.style.flex = "1 1 280px";

  const didLabel = document.createElement("div");
  didLabel.style.fontSize = "12px";
  didLabel.style.opacity = ".8";
  didLabel.style.marginBottom = "6px";
  didLabel.textContent = t("license.activate.device_id");

  const didInput = document.createElement("input");
  didInput.value = deviceId;
  didInput.readOnly = true;
  didInput.style.width = "100%";
  didInput.style.padding = "10px";
  didInput.style.borderRadius = "12px";
  didInput.style.border = "1px solid rgba(255,255,255,.14)";
  didInput.style.background = "rgba(0,0,0,.25)";
  didInput.style.color = "#fff";
  didInput.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  didInput.style.fontSize = "13px";

  didWrap.appendChild(didLabel);
  didWrap.appendChild(didInput);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.textContent = t("license.activate.copy");
  copyBtn.style.height = "42px";
  copyBtn.style.padding = "0 14px";
  copyBtn.style.borderRadius = "12px";
  copyBtn.style.border = "1px solid rgba(255,255,255,.14)";
  copyBtn.style.background = "rgba(255,255,255,.08)";
  copyBtn.style.color = "#fff";
  copyBtn.style.fontWeight = "700";
  copyBtn.style.cursor = "pointer";
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
      copyBtn.textContent = t("license.activate.copied");
      setTimeout(()=>copyBtn.textContent=t("license.activate.copy"), 900);
    } catch {
      didInput.select();
    }
  });

  row.appendChild(didWrap);
  row.appendChild(copyBtn);

  const codeLabel = document.createElement("div");
  codeLabel.style.fontSize = "12px";
  codeLabel.style.opacity = ".8";
  codeLabel.style.marginBottom = "6px";
  codeLabel.textContent = t("license.activate.code_label");

  const codeArea = document.createElement("textarea");
  codeArea.placeholder = t("license.activate.paste_hint");
  codeArea.style.width = "100%";
  codeArea.style.height = "96px";
  codeArea.style.padding = "10px";
  codeArea.style.borderRadius = "12px";
  codeArea.style.border = "1px solid rgba(255,255,255,.14)";
  codeArea.style.background = "rgba(0,0,0,.25)";
  codeArea.style.color = "#fff";
  codeArea.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
  codeArea.style.fontSize = "13px";
  codeArea.style.resize = "vertical";

  const err = document.createElement("div");
  err.style.marginTop = "10px";
  err.style.fontSize = "13px";
  err.style.color = "#ff6b6b";
  err.style.display = initialErrorKey ? "block" : "none";
  err.textContent = initialErrorKey ? t(initialErrorKey) : "";

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "10px";
  actions.style.justifyContent = "flex-end";
  actions.style.marginTop = "14px";
  actions.style.flexWrap = "wrap";

  const activateBtn = document.createElement("button");
  activateBtn.type = "button";
  activateBtn.textContent = t("license.activate.activate_btn");
  activateBtn.style.height = "42px";
  activateBtn.style.padding = "0 16px";
  activateBtn.style.borderRadius = "12px";
  activateBtn.style.border = "none";
  activateBtn.style.background = "#0a84ff";
  activateBtn.style.color = "#fff";
  activateBtn.style.fontWeight = "800";
  activateBtn.style.cursor = "pointer";

  activateBtn.addEventListener("click", () => {
    const token = String(codeArea.value || "").trim();
    if (!token) {
      err.style.display = "block";
      err.textContent = t("license.activate.error_missing");
      return;
    }

    const v = verifyToken(token, deviceId);
    if (!v.ok) {
      err.style.display = "block";
      const map = {
        invalid: "license.activate.error_invalid",
        expired: "license.activate.error_expired",
        device: "license.activate.error_device",
      };
      err.textContent = t(map[v.err] || "license.activate.error_invalid");
      return;
    }

    const settings = loadSettings() || {};
    settings.license = {
      token,
      deviceId,
      iat: Number(v.payload.iat) || nowMs(),
      exp: Number(v.payload.exp),
      note: String(v.payload.note || ""),
    };
    ensurePremiumOn(settings);
    saveSettings(settings);

    // Extra: dup store voor recovery
    try { localStorage.setItem("finflow_test_token_v1", token); } catch {}

    err.style.display = "block";
    err.style.color = "#9be49b";
    err.textContent = t("license.activate.success");

    setTimeout(() => {
      location.reload();
    }, 500);
  });

  actions.appendChild(activateBtn);

  card.appendChild(title);
  card.appendChild(instr);
  card.appendChild(row);
  card.appendChild(codeLabel);
  card.appendChild(codeArea);
  card.appendChild(err);
  card.appendChild(actions);

  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

/**
 * @returns {Promise<boolean>} true => app mag doorstarten, false => geblokkeerd (overlay actief)
 */
export async function ensureTestActivationOrBlock() {
  const deviceId = getOrCreateDeviceId();

  // Probeer settings token
  const settings = loadSettings() || {};
  const tokenFromSettings = settings?.license?.token;
  const tokenFromLS = (() => { try { return localStorage.getItem("finflow_test_token_v1"); } catch { return null; } })();
  const token = tokenFromSettings || tokenFromLS;

  if (token) {
    const v = verifyToken(token, deviceId);
    if (v.ok) {
      // Zorg dat Premium aan staat (direct Premium)
      const updated = ensurePremiumOn(settings);
      // Zorg dat license struct up-to-date is
      updated.license = {
        token,
        deviceId,
        iat: Number(v.payload.iat) || nowMs(),
        exp: Number(v.payload.exp),
        note: String(v.payload.note || ""),
      };
      saveSettings(updated);
      removeGateOverlayIfAny();
      return true;
    }
    // token aanwezig maar ongeldig/verlopen/device mismatch => opnieuw activeren
    showGateOverlay(deviceId, v.err === "expired" ? "license.activate.error_expired" : "license.activate.error_invalid");
    return false;
  }

  // Geen token => activatie nodig
  showGateOverlay(deviceId);
  return false;
}
