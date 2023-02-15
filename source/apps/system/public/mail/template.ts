export const mail_template = (message_title: string, message_text: string, button_text: string, button_link: string) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "https://www.w3.org/TR/html4/strict.dtd">
<html lang="es-419">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <style type="text/css" nonce="">
    body,
    td,
    div,
    p,
    a,
    input {
      font-family: arial, sans-serif;
    }
  </style>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link rel="shortcut icon" href="https://favicon.ico" type="image/x-icon">
  <title>${message_title}</title>
  <style type="text/css" nonce="">
    body,
    td {
      font-size: 13px
    }

    a:link,
    a:active {
      color: #1155CC;
      text-decoration: none
    }

    a:hover {
      text-decoration: underline;
      cursor: pointer
    }

    a:visited {
      color: #6611CC
    }

    img {
      border: 0px
    }

    pre {
      white-space: pre;
      white-space: -moz-pre-wrap;
      white-space: -o-pre-wrap;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-width: 800px;
      overflow: auto;
    }

    .logo {
      left: -7px;
      position: relative;
    }
  </style>
</head>

<body>
  <div class="bodycontainer">
    <div class="maincontent">
      <table class="message" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tbody>
          <tr>
            <td colspan="2">
              <table width="100%" cellspacing="0" cellpadding="12" border="0">
                <tbody>
                  <tr>
                    <td>
                      <div style="overflow: hidden;">
                        <font size="-1">
                          <div dir="ltr">
                            <div style="font-family:Calibri,Arial,Helvetica,sans-serif;font-size:12pt;color:rgb(0,0,0)">
                              <br>
                            </div>
                            <div>
                              <div style="color:rgb(0,0,0);padding:4px">
                                <center>
                                  <div style="color:rgb(0,0,0);padding:4px">
                                    <table style="width:100%!important;table-layout:fixed;background-color:#f2f3f3"
                                      width="100%" cellspacing="0" cellpadding="0" border="0">
                                      <tbody>
                                        <tr>
                                          <td align="center" height="50">&nbsp;
                                          </td>
                                        </tr>
                                        <tr>
                                          <td width="100%" valign="top">
                                            <table role="content-container"
                                              style="border:1px solid #dadada;background-color:white;max-width:825px"
                                              width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                                              <tbody>
                                                <tr>
                                                  <td
                                                    style="padding-top:60px;padding-bottom:60px;padding-left:10px;padding-right:10px"
                                                    width="100%">
                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <table cellspacing="0" cellpadding="0" border="0"
                                                              align="center">
                                                              <tbody>
                                                                <tr>
                                                                  <td role="modules-container"
                                                                    style="padding:0px 0px 0px 0px;color:#000000;text-align:left"
                                                                    width="100%" bgcolor="#ffffff" align="left">
                                                                    <table role="module"
                                                                      style="display:none!important;opacity:0;color:transparent;height:0;width:0"
                                                                      width="100%" cellspacing="0" cellpadding="0"
                                                                      border="0">
                                                                      <tbody>
                                                                        <tr>
                                                                          <td role="module-content">
                                                                            <p style="margin:0px;padding:0px">
                                                                            </p>
                                                                          </td>
                                                                        </tr>
                                                                      </tbody>
                                                                    </table>
                                                                    <table role="module"
                                                                      style="padding:0px 0px 0px 0px;box-sizing:border-box"
                                                                      width="100%" cellspacing="0" cellpadding="0"
                                                                      border="0" bgcolor="" align="center">
                                                                      <tbody>
                                                                        <tr role="module-content">
                                                                          <td valign="top" height="100%">
                                                                            <table
                                                                              style="width:600.000px;border-spacing:0;border-collapse:collapse;margin:0px 0px 0px 0px"
                                                                              width="600.000" cellspacing="0"
                                                                              cellpadding="0" border="0" bgcolor=""
                                                                              align="left">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td
                                                                                    style="padding:0px;margin:0px;border-spacing:0">
                                                                                    <table role="module"
                                                                                      style="table-layout:fixed"
                                                                                      width="100%" cellspacing="0"
                                                                                      cellpadding="0" border="0">
                                                                                      <tbody>
                                                                                        <tr>
                                                                                          <td
                                                                                            style="padding:18px 0px 18px 0px;line-height:22px;text-align:inherit"
                                                                                            valign="top" height="100%"
                                                                                            bgcolor="">
                                                                                            <div
                                                                                              style="color:rgb(0,0,0);padding:4px;text-align:center">
                                                                                              <span
                                                                                                style="font-family:arial,helvetica,sans-serif;color:#00303b"><strong><span
                                                                                                    style="font-size:28px">${message_title}
                                                                                                  </span></strong></span>
                                                                                            </div>
                                                                                          </td>
                                                                                        </tr>
                                                                                      </tbody>
                                                                                    </table>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </tbody>
                                                                    </table>
                                                                    <table role="module" style="padding:0px 0px 0px 0px"
                                                                      width="100%" cellspacing="0" cellpadding="0"
                                                                      border="0" bgcolor="" align="center">
                                                                      <tbody>
                                                                        <tr role="module-content">
                                                                          <td valign="top" height="100%">
                                                                            <table
                                                                              style="width:600.000px;border-spacing:0;border-collapse:collapse;margin:0px 0px 0px 0px"
                                                                              width="600.000" cellspacing="0"
                                                                              cellpadding="0" border="0" bgcolor=""
                                                                              align="left">
                                                                              <tbody>
                                                                                <tr>
                                                                                  <td
                                                                                    style="padding:0px;margin:0px;border-spacing:0">
                                                                                    <table role="module"
                                                                                      style="width:100%!important;table-layout:fixed;table-layout:fixed"
                                                                                      width="100%" cellspacing="0"
                                                                                      cellpadding="0" border="0">
                                                                                      <tbody>
                                                                                        <tr>
                                                                                          <td
                                                                                            style="font-size:6px;line-height:10px;padding:0px 0px 0px 0px"
                                                                                            valign="top" align="center">
                                                                                            <img alt=""
                                                                                              style="display:block;max-width:80%;width:396px;margin-top:20px;margin-bottom:15px"
                                                                                              src="https://jmlxxvi.github.io/images/icons/geek_zombie256.png"
                                                                                              border="0">
                                                                                          </td>
                                                                                        </tr>
                                                                                      </tbody>
                                                                                    </table>
                                                                                    <table role="module"
                                                                                      style="table-layout:fixed"
                                                                                      width="100%" cellspacing="0"
                                                                                      cellpadding="0" border="0">
                                                                                      <tbody>
                                                                                        <tr>
                                                                                          <td
                                                                                            style="padding:18px 0px 18px 0px;line-height:22px;text-align:center;padding:10px 5px"
                                                                                            valign="top" height="100%"
                                                                                            bgcolor="">
                                                                                            <div
                                                                                              style="color:rgb(0,0,0);color:rgb(0,48,59);padding:4px;max-width:500px;display:inline-block;text-align:center">
                                                                                              <p
                                                                                                style="margin:0px;padding:0px">
                                                                                                ${message_text}
                                                                                              </p>

                                                                                            </div>
                                                                                          </td>
                                                                                        </tr>
                                                                                      </tbody>
                                                                                    </table>
                                                                                    <table role="module"
                                                                                      style="table-layout:fixed;margin-top:20px"
                                                                                      width="100%" cellspacing="0"
                                                                                      cellpadding="0" border="0">
                                                                                      <tbody>
                                                                                        <tr>
                                                                                          <td
                                                                                            style="padding:0px 0px 0px 0px"
                                                                                            bgcolor="" align="center">
                                                                                            <table
                                                                                              style="text-align:center"
                                                                                              cellspacing="0"
                                                                                              cellpadding="0"
                                                                                              border="0">
                                                                                              <tbody>
                                                                                                <tr>
                                                                                                  <td
                                                                                                    style="border-radius:6px;font-size:16px;text-align:center;background-color:inherit"
                                                                                                    bgcolor="#fc6d69"
                                                                                                    align="center">
                                                                                                    <a href="${button_link}"
                                                                                                      style="color:rgb(17,136,230);text-decoration:none;background-color:#6c006c;border:1px solid #333333;border-color:#333333;border-radius:0px;border-width:0px;color:#ffffff;display:inline-block;font-family:arial,helvetica,sans-serif;font-size:21px;font-weight:normal;letter-spacing:1.0px;line-height:31px;padding:12px 40px 12px 40px;text-align:center;text-decoration:none;white-space:nowrap"
                                                                                                      target="_blank"
                                                                                                    >
                                                                                                      ${button_text}
                                                                                                    </a>
                                                                                                  </td>
                                                                                                </tr>
                                                                                              </tbody>
                                                                                            </table>
                                                                                          </td>
                                                                                        </tr>
                                                                                      </tbody>
                                                                                    </table>
                                                                                  </td>
                                                                                </tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </tbody>
                                                                    </table>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td style="height:50px">&nbsp;</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </center>
                              </div>
                            </div>
                          </div>
                        </font>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
`;