import { assertEquals } from 'https://deno.land/std@0.148.0/testing/asserts.ts';
import { AliSMS } from './sms.ts';

const ALISMS_ACCESS_KEY_ID = Deno.env.get('ALISMS_ACCESS_KEY_ID')!;
const ALISMS_ACCESS_KEY_SECRET = Deno.env.get('ALISMS_ACCESS_KEY_SECRET')!;

/**
 * 测试发送短信
 *
 * @author zk <zk@go0356.com>
 */
Deno.test('testSendSMS', async () => {
  const accessKeyID = ALISMS_ACCESS_KEY_ID;
  const accessKeySecret = ALISMS_ACCESS_KEY_SECRET;
  const sms = new AliSMS(accessKeyID, accessKeySecret);

  const phoneNumbers: string[] = ['15135654070'];
  const signName = '高远手机';
  const tplCode = 'SMS_8170249';
  const tplParam = '{"customer": "kouler"}';
  const res = await sms.sendSMS(phoneNumbers, signName, tplCode, tplParam);

  console.log(res, res.code, res.message);
  assertEquals(res.code, 'OK');
});

/**
 * 测试查询短信发送详情
 *
 * @author zk <zk@go0356.com>
 */
Deno.test('testQuerySendDetails', async () => {
  const accessKeyID = ALISMS_ACCESS_KEY_ID;
  const accessKeySecret = ALISMS_ACCESS_KEY_SECRET;
  const sms = new AliSMS(accessKeyID, accessKeySecret);

  const phoneNumber = '15135654070';
  const sendDate = '20220812';
  const pageSize = 1;
  const currentPage = 1;
  const res = await sms.querySendDetails(
    phoneNumber,
    sendDate,
    pageSize,
    currentPage,
  );

  console.log(res, res.code, res.message);
  assertEquals(res.code, 'OK');
});

/**
 * 测试构造签名字符串
 *
 * @author zk <zk@go0356.com>
 */
Deno.test('testStringToSign', () => {
  const AccessKeyId = 'testid';
  const AccessKeySecret = 'testsecret';
  const method = 'GET';
  const Action = 'DescribeDedicatedHosts';
  const SignatureMethod = 'HMAC-SHA1';
  const SignatureVersion = '1.0';
  const SignatureNonce = '3ee8c1b8-xxxx-xxxx-xxxx-xxxxxxxxx';
  const Timestamp = '2016-02-23T12:46:24Z';
  const Version = '2014-05-26';
  const Format = 'XML';

  const sms = new AliSMS(AccessKeyId, AccessKeySecret);
  const paramsStr = sms.specParams({
    Action: Action,
    AccessKeyId: AccessKeyId,
    SignatureMethod: SignatureMethod,
    SignatureVersion: SignatureVersion,
    SignatureNonce: SignatureNonce,
    Timestamp: Timestamp,
    Version: Version,
    Format: Format,
  });

  const res = sms.stringToSign(method, paramsStr);

  assertEquals(
    res,
    'GET&%2F&AccessKeyId%3Dtestid%26Action%3DDescribeDedicatedHosts%26Format%3DXML%26SignatureMethod%3DHMAC-SHA1%26SignatureNonce%3D3ee8c1b8-xxxx-xxxx-xxxx-xxxxxxxxx%26SignatureVersion%3D1.0%26Timestamp%3D2016-02-23T12%253A46%253A24Z%26Version%3D2014-05-26',
  );
});

/**
 * 测试签名加密
 *
 * @author zk <zk@go0356.com>
 */
Deno.test('testSignature', async () => {
  const AccessKeyId = 'testid';
  const AccessKeySecret = 'testsecret';
  const sms = new AliSMS(AccessKeyId, AccessKeySecret);

  const sign =
    'GET&%2F&AccessKeyId%3Dtestid%26Action%3DDescribeDedicatedHosts%26Format%3DXML%26SignatureMethod%3DHMAC-SHA1%26SignatureNonce%3D3ee8c1b8-xxxx-xxxx-xxxx-xxxxxxxxx%26SignatureVersion%3D1.0%26Timestamp%3D2016-02-23T12%253A46%253A24Z%26Version%3D2014-05-26';
  const res = await sms.hmac(sign, AccessKeySecret);

  console.log(res);

  assertEquals(res, 'rARsF+BIg8pZ4e0ln6Z96lBMDms=');
});
