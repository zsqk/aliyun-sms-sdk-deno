/**
 * 阿里云短信模块
 *
 * 已支持的功能
 *  - 发送短息
 *  - 查询短信发送详情
 *
 * API 概览：{@link https://help.aliyun.com/document_detail/419298.html#concept-t4w-pcs-ggb}
 * 签名机制：{@link https://help.aliyun.com/document_detail/135037.htm?spm=a2c4g.11186623.0.0.54994fddXtxB8D#concept-2022720}
 * 短信服务错误码列表：{@link https://help.aliyun.com/document_detail/101345.html}
 */

import { encode } from 'https://deno.land/std@0.143.0/encoding/base64.ts';
import { hmac } from 'https://deno.land/x/somefn@v0.18.0/js/hash.ts?s=hmac';

/**
 * 发送短信响应类型
 *
 * @author zk <zk@go0356.com>
 */
export type RespSendSMS = {
  /** code 为 OK 表示 API 调用成功，但不代表短信已发送成功 */
  code: string;
  message: string;
  requestID: string;
  /** bizID 代表短信发送回执 ID。可根据回执 ID 查询具体的发送状态 */
  bizID?: string;
};

/**
 * 查询短信发送状态响应类型
 *
 * @author zk <zk@go0356.com>
 */
export type RespQuerySendDetails = {
  /** code 为 OK 表示 API 调用成功，但不代表短信已发送成功 */
  code: string;
  message: string;
  requestID: string;
  totalCount?: number;
  /** smsSendDetailDTOs 表示短信发送明细 */
  smsSendDetailDTOs?: { smsSendDetailDTO: SendDetail[] };
};

/**
 * 短信发送详情类型
 *
 * @author zk <zk@go0356.com>
 */
export type SendDetail = {
  /** 短信模版 ID */
  templateCode: string;
  /** 短信接收日期和时间 */
  receiveDate: string;
  /** 接受短信的手机号码 */
  phoneNum: string;
  /** 短信内容 */
  content: string;
  /** 短信发送状态 */
  sendStatus: SendDetailStatus;
  /** 短信发送日期和时间 */
  sendDate: string;
  /** 运营商短信状态码 */
  errCode: string;
};

/**
 * 短信发送状态
 *
 * @author zk <zk@go0356.com>
 */
export enum SendDetailStatus {
  '等待回执' = 1,
  '发送失败' = 2,
  '发送成功' = 3,
}

/**
 * 阿里云短信
 */
export class AliSMS {
  protected format = 'JSON';
  protected version = '2017-05-25';
  protected signatureMethod = 'HMAC-SHA1';
  protected signatureVersion = '1.0';
  protected endPoint = 'https://dysmsapi.aliyuncs.com';

  protected accessKeyID: string;
  protected accessKeySecret: string;

  constructor(accessKeyID: string, accessKeySecret: string) {
    this.accessKeyID = accessKeyID;
    this.accessKeySecret = accessKeySecret;
  }

  /**
   * 发送短信
   *
   * 为了保持接口简单，暂不支持以下不常用的请求字段
   *  - SmsUpExtendCode 上行短信扩展码
   *  - OutId 外部流水扩展字段
   *
   * 接口文档: {@link https://help.aliyun.com/document_detail/419273.html}
   *
   * @param phoneNumbers 手机号码
   * @param signName 签名
   * @param tplCode 短信模版
   * @param tplParam 短信模版参数
   *
   * @author zk <zk@go0356.com>
   */
  async sendSMS(
    phoneNumbers: string[],
    signName: string,
    tplCode: string,
    tplParam?: string,
  ): Promise<RespSendSMS> {
    const action = 'SendSms';
    const method = 'GET';
    const params: Record<string, unknown> = {
      AccessKeyId: this.accessKeyID,
      Action: action,
      Format: this.format,
      Version: this.version,
      Timestamp: this.getNowISOTime(),
      SignatureNonce: this.getNonce(),
      SignatureMethod: this.signatureMethod,
      SignatureVersion: this.signatureVersion,
      PhoneNumbers: phoneNumbers,
      SignName: signName,
      TemplateCode: tplCode,
    };

    if (tplParam) {
      params.TemplateParam = tplParam;
    }

    // 获取签名
    //  1. 构造规范化请求字符串
    //  2. 构造待签名字符串
    //  3. 计算签名值
    const paramsStr = this.specParams(params);
    const strToSign = this.stringToSign(method, paramsStr);
    const signature = await this.hmac(strToSign, this.accessKeySecret);

    const url = `${this.endPoint}/?${paramsStr}&Signature=${
      encodeURIComponent(
        signature,
      )
    }`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result = await resp.json();
    if (result.Code !== 'OK') {
      console.error(`发送短信错误：${JSON.stringify(result)}`);
      return {
        code: result.Code,
        message: result.Message,
        requestID: result.RequestId,
      };
    }

    return {
      code: result.Code,
      message: result.Message,
      requestID: result.RequestId,
      bizID: result.BizId,
    };
  }

  /**
   * 查询短信发送详情
   *
   * 接口文档: {@link https://help.aliyun.com/document_detail/419277.html}
   */
  async querySendDetails(
    phoneNumber: string,
    sendDate: string,
    pageSize: number,
    currentPage: number,
    bizID?: string,
  ): Promise<RespQuerySendDetails> {
    const action = 'QuerySendDetails';
    const method = 'GET';
    const params: Record<string, unknown> = {
      AccessKeyId: this.accessKeyID,
      Action: action,
      Format: this.format,
      Version: this.version,
      Timestamp: this.getNowISOTime(),
      SignatureNonce: this.getNonce(),
      SignatureMethod: this.signatureMethod,
      SignatureVersion: this.signatureVersion,
      PhoneNumber: phoneNumber,
      SendDate: sendDate,
      PageSize: pageSize,
      CurrentPage: currentPage,
    };

    if (bizID) {
      params.BizID = bizID;
    }

    // 获取签名
    //  1. 构造规范化请求字符串
    //  2. 构造待签名字符串
    //  3. 计算签名值
    const paramsStr = this.specParams(params);
    const strToSign = this.stringToSign(method, paramsStr);
    const signature = await this.hmac(strToSign, this.accessKeySecret);

    const url = `${this.endPoint}/?${paramsStr}&Signature=${
      encodeURIComponent(
        signature,
      )
    }`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result = await resp.json();
    if (result.Code !== 'OK') {
      console.error(`查询短信发送状态错误：${JSON.stringify(result)}`);
      return {
        code: result.Code,
        message: result.Message,
        requestID: result.RequestId,
      };
    }

    const detailsDTO: [] = result.SmsSendDetailDTOs.SmsSendDetailDTO;
    const details: SendDetail[] = detailsDTO.map(
      (v: {
        TemplateCode: string;
        ReceiveDate: string;
        PhoneNum: string;
        Content: string;
        SendStatus: SendDetailStatus;
        SendDate: string;
        ErrCode: string;
      }) => {
        return {
          templateCode: v.TemplateCode,
          receiveDate: v.ReceiveDate,
          phoneNum: v.PhoneNum,
          content: v.Content,
          sendDate: v.SendDate,
          sendStatus: v.SendStatus,
          errCode: v.ErrCode,
        };
      },
    );

    return {
      code: result.Code,
      message: result.Message,
      requestID: result.RequestId,
      totalCount: result.TotalCount,
      smsSendDetailDTOs: { smsSendDetailDTO: details },
    };
  }

  /**
   * 获取随机数
   *
   * @author zk <zk@go0356.com>
   */
  getNonce(): number {
    return Math.floor(new Date().getTime() * Math.random());
  }

  /**
   * 获取当前时间的 ISO 格式
   *
   * @author zk <zk@go0356.com>
   */
  getNowISOTime(): string {
    return new Date(new Date().getTime()).toISOString();
  }

  /**
   * 获取加密后的签名值
   *
   * @author zk <zk@go0356.com>
   */
  async hmac(sign: string, secret: string): Promise<string> {
    const secretSuffix = '&';
    const u = await hmac({ hash: 'SHA-1', s: secret + secretSuffix }, sign);
    return encode(u);
  }

  /**
   * 构造规范化请求参数
   *
   * @author zk <zk@go0356.com>
   */
  specParams(params: Record<string, unknown>): string {
    // 对 key 按 ASCII 排序
    const keys: string[] = Object.keys(params);
    const keysSorted = keys.sort();

    // 构造签名字符串
    let sign = ``;
    keysSorted.forEach((v) => {
      if (v !== 'Signature') {
        sign += `&${v}=${encodeURIComponent(String(params[v]))}`;
      }
    });

    return sign.substring(1);
  }

  /**
   * 构造签名字符串
   *
   * @author zk <zk@go0356.com>
   */
  stringToSign(method: 'GET' | 'POST', paramsStr: string): string {
    return `${method}&%2F&` + encodeURIComponent(paramsStr);
  }
}
