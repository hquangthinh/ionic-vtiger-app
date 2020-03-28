import { Component } from '@angular/core';

import {
  MenuController, NavController, LoadingController, AlertController,
  NavParams, Loading, ToastController
}
  from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@ionic-native/network';
import Tesseract from 'tesseract.js';
import image2base64 from 'image-to-base64';

import { OcrService } from '../../providers/ocr-service';
import { ContactDto } from '../../model/contact-dto';
import { EditContactDetailPage } from '../contact/edit-contact-detail';
import { BasePage } from '../base-page';

@Component({
  selector: 'scan-business-card-page',
  templateUrl: 'scan-business-card-page.html'
})
export class ScanBusinessCardPage extends BasePage {
  private imageType: string;
  private imageSrc: string;
  private rawImageDataBase64: string;
  private langCode: string = "eng";
  private detectionMethod: string = "method1_msocr";
  private loadProgress: number = 0;

  private fieldList: Array<any> = [
    { id: 0, title: "--Not Mapped--" },
    { id: 1, title: "Danh xưng" },
    { id: 2, title: "Tên" },
    { id: 3, title: "Mobile" },
    { id: 4, title: "Fax" },
    { id: 5, title: "Email" },
    { id: 6, title: "Website" },
    { id: 7, title: "Địa chỉ" },
    { id: 8, title: "Công ty" }
  ];

  private rotateDeg = 0;
  private imgRotateClass = 'rotate0';
  private showFileUri =  true;

  private bizCardLines: Array<any> = [];

  constructor(
    public menuCtrl: MenuController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public network: Network,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public translate: TranslateService,
    public ocrService: OcrService
  ) {
    super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
    this.imageType = navParams.get("imageType");
    if ("FILE_URI" == this.imageType) {
      this.imageSrc = navParams.get("imageSrc");
    } else if ("DATA_URL" == this.imageType) {
      this.imageSrc = navParams.get("base64Image");
      this.rawImageDataBase64 = navParams.get("rawImageDataBase64");
    } else {
      this.imageSrc = navParams.get("imageSrc");
    }
  }

  // private showDebugInfo() {
  //     console.log(this.imageType);
  //     console.log(this.imageSrc);
  //     if(!this.imageType || this.imageType === 'FILE_URI'){
  //         this.getImageDataUri(this.imageSrc, 'data_uri', dataUri => {
  //             let binData = this.dataURItoBlob(dataUri);
  //             console.log(binData);
  //         });
  //     }
  // }

  private noConnection() {
    return (this.network.type === 'none' || this.network.type === 'unknown');
  }

  // rotate image
  rotate() {
    this.rotateDeg += 90;
    if(this.rotateDeg === 90)
      this.imgRotateClass = 'rotate90';
    else if(this.rotateDeg === 180)
      this.imgRotateClass = 'rotate180';
    else if(this.rotateDeg === 270)
      this.imgRotateClass = 'rotate270';
    else if(this.rotateDeg === 360) {
      this.imgRotateClass = 'rotate0';
      this.rotateDeg = 0;
    }
  }

  analyzeBizCard() {
    if (this.noConnection()) {
      super.showUIError('Chức năng này cần có kết nối mạng.');
      return;
    }
    let loader = this.loadingCtrl.create({
      content: 'Please wait...'
    });
    loader.present().then(
      () => {
        if (this.detectionMethod === 'method1_msocr') {
          // this.performCardAnalyzeWithMsOcrApi(loader);
          this.performCardAnalyzeWithGoogleVisionApi(loader);
        } else if (this.detectionMethod === 'method1_tesseract') {
          this.performCardAnalyzeWithTesseract(loader);
        }
      }
    );
  }

  private dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
    else
      byteString = (<any>window).unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
  }

  private getImageDataUri(url, returnImageFormat, callback) {
    var image = new Image();

    image.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(canvas, 0, 0);

      if (returnImageFormat === 'raw_data') {
        callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
      } else if (returnImageFormat === 'data_uri') {
        callback(canvas.toDataURL('image/png'));
      }
    };
    image.src = url;
  }

  private performCardAnalyzeWithMsOcrApi(loader: Loading) {
    if (!this.imageType || this.imageType === 'FILE_URI') {
      this.getImageDataUri(this.imageSrc, 'data_uri', dataUri => {
        let imageBinData = this.dataURItoBlob(dataUri);
        this.sendAnalyzeTextRequest(imageBinData, loader);
      });
    } else if (this.imageType === 'DATA_URL') {
      let imageBinData = this.dataURItoBlob(this.imageSrc);
      this.sendAnalyzeTextRequest(imageBinData, loader);
    } else {
      super.showUIError('Invalid image data');
    }
  }

  private performCardAnalyzeWithGoogleVisionApi(loader: Loading) {
    if (!this.imageType || this.imageType === 'FILE_URI') {
      image2base64(this.imageSrc).then((imgBase64) => {
          this.sendAnalyzeTextRequestWithGoogleVision(imgBase64, loader);
        })
        .catch((error) => {
          loader.dismissAll();
      });
    } else if (this.imageType === 'DATA_URL') {
      this.sendAnalyzeTextRequestWithGoogleVision(this.rawImageDataBase64, loader);
    } else {
      super.showUIError('Invalid image data');
    }
  }

  private sendAnalyzeTextRequestWithGoogleVision(imageBase64Encode, loader: Loading) {
    // console.log('sending ocr req google vision ', imageBase64Encode);
    this.ocrService.regconizeTextWithGoogleVision(imageBase64Encode).then(
      result => {
        if (!result.success) {
          loader.dismissAll();
          super.showUIError(result.message);
        } else {
          this.bizCardLines = result.lines.map(line => {
            return {
              fieldId: 0,
              text: line
            };
          });
          loader.dismissAll();
        }
      }
    ).catch(err => super.showUIError(err));
  }

  private sendAnalyzeTextRequest(imageBinData: Blob, loader: Loading) {
    this.ocrService.recognizeText(imageBinData).then(
      result => {
        if (!result.success) {
          loader.dismissAll();
          super.showUIError(result.message);
        } else {
          this.bizCardLines = result.lines.map(line => {
            return {
              fieldId: 0,
              text: line
            };
          });
          loader.dismissAll();
        }
      }
    ).catch(err => super.showUIError(err));
  }

  private performCardAnalyzeWithTesseract(loader: Loading) {

    Tesseract.recognize(document.getElementById('image'), {
      lang: this.langCode
    })
      .progress(message => {
        //console.log(message);
        if (this.loadProgress < 100) {
          this.loadProgress++;
        }
      })
      .catch(err => {
        super.showConsoleError(err);
      })
      .then(result => {
        let cardLines = new Array<any>();
        result.lines.forEach((line, idx, arr) => {
          let fieldId = 0;
          if (idx < this.fieldList.length) {
            fieldId = this.fieldList[idx].id;
          }
          cardLines.push({ text: line.text, fieldId: fieldId });
        });
        this.bizCardLines = cardLines;
        //console.log(this.bizCardLines);
        this.loadProgress = 100;
      })
      .finally(resultOrError => {
        loader.dismissAll();
        if (this.bizCardLines && this.bizCardLines.length > 0) {
          super.showUIMessage('Dữ liệu đã được scan. Bạn hạn xem kết quả ở cuối trang màn hình.');
        }
      });
  }

  createContact() {
    let contactModel = new ContactDto();
    contactModel.salutationType = this.getFieldValue(this.bizCardLines, 1);
    contactModel.name = this.getFieldValue(this.bizCardLines, 2);
    contactModel.phoneNumber = this.getFieldValue(this.bizCardLines, 3);
    contactModel.email = this.getFieldValue(this.bizCardLines, 5);
    contactModel.website = this.getFieldValue(this.bizCardLines, 6);
    contactModel.address = this.getFieldValue(this.bizCardLines, 7);

    console.log(contactModel);

    this.navCtrl.push(EditContactDetailPage, { contactId: "0", defaultModel: contactModel });
  }

  private getFieldValue(arr: Array<any>, fieldId: number): string {
    let matchedLines = arr.filter(el => el.fieldId == fieldId);
    if (matchedLines && matchedLines.length > 0) {
      return matchedLines.map(el => el.text).join(". ");
    }
    return "";
  }
}
