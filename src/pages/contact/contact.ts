import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, MenuController,
    ToastController, ModalController } from 'ionic-angular';
import { CallNumber } from '@ionic-native/call-number';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import { BasePage } from '../base-page';
import { ViewContactDetailPage } from './view-contact-detail';
import { EditContactDetailPage } from './edit-contact-detail';
import { PotentialListModalPage } from './potential-list-modal';

import { UserService } from '../../providers/user-service';
import { ContactService } from '../../providers/contact-service';
import { DataSyncService } from '../../providers/data-sync-service';

import { SORTED_FIELDS  } from '../../providers/configuration-service';
import { KeywordSearchCommand, SearchContactCommand } from '../../model/search-commands';
import { ContactDto } from '../../model/contact-dto';
import { UserLoginSessionDto } from '../../model/login-dto';

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage extends BasePage {

    contacts: Array<ContactDto>;
    userSessionId: string;
    userSessionDto: UserLoginSessionDto;
    bSortByFirstName: boolean = false;
    bSortByLastName: boolean = false;
    bSortByCreatedDate: boolean = false;
    bSortByModifedDate: boolean = true;
    localSearchKeyword: string = "";

    constructor(
      public menuCtrl: MenuController,
      public navCtrl: NavController,
      public loadingCtrl: LoadingController,
      public alertCtrl: AlertController,
      public toastCtrl: ToastController,
      public modalCtrl: ModalController,
      public storage: Storage,
      public translate: TranslateService,
      public userService: UserService,
      public contactService: ContactService,
      public dataSyncService: DataSyncService,
      public callNumber: CallNumber
      )
      {
        super(menuCtrl, navCtrl, loadingCtrl, alertCtrl, toastCtrl, translate);
      }

    ionViewDidEnter() {
      let loader = super.createLoading();
      loader.present().then(
        () => {
          this.loadContacts('', '').then(
            data => {
              loader.dismissAll();
              if(data && data.length === 0) {
                this.refreshServer('');
              }
            }
          );
        }
      );
    }

    loadContacts(keyword: string, sortedField: string): Promise<any> {

      if(!keyword || keyword == ''){
        return this.contactService.loadContactListFromStorage().then(
          data => {
            this.contacts = this.sortData(data, sortedField);
            return this.contacts;
          }
        );
      }
    }

    private sortData(dataList: ContactDto[], sortedField: string): ContactDto[] {

      if(!sortedField || sortedField == '')
        return dataList;

      return dataList.sort((a,b) => {
        if(sortedField === SORTED_FIELDS.ContactFirstName){
          return this.sortByFirstNameComparer(a,b);
        }else if(sortedField === SORTED_FIELDS.ContactLastName){
          return this.sortByLastNameComparer(a,b);
        }
        else if(sortedField === SORTED_FIELDS.ContactCreatedDate){
          return this.sortByCreatedTimeComparer(a,b);
        }
        return this.sortByModifiedTimeComparer(a,b);
      });
    }

    private sortByFirstNameComparer(a: ContactDto, b: ContactDto): number {
      if(a && b && a.firstName && b.firstName)
        return a.firstName.localeCompare(b.firstName);
      return 0;
    }

    private sortByLastNameComparer(a: ContactDto, b: ContactDto): number {
      if(a && b && a.lastName && b.lastName)
        return a.lastName.localeCompare(b.lastName);
      return 0;
    }

    private sortByCreatedTimeComparer(a: ContactDto, b: ContactDto): number {
      if(a && b && a.createdDate && b.createdDate){
        let createdTime1 = new Date(a.createdDate);
        let createdTime2 = new Date(b.createdDate);
        return createdTime1 < createdTime2 ? -1 :
          createdTime1 > createdTime2 ? 1 : 0;
      }
    }

    private sortByModifiedTimeComparer(a: ContactDto, b: ContactDto): number {
      if(a && b && a.modifiedDate && b.modifiedDate){
        let modifiedTime1 = new Date(a.modifiedDate);
        let modifiedTime2 = new Date(b.modifiedDate);
        return modifiedTime1 < modifiedTime2 ? -1 :
          modifiedTime1 > modifiedTime2 ? 1 : 0;
      }
    }

    reloadContacts(keyword: string, sortedField: string) {
      let loading = super.createLoading();
      loading.present()
        .then(() => {
          this.loadContacts(keyword, sortedField).then(
            () => loading.dismissAll()
          );
        })
        .catch(super.showConsoleError);
    }

    // prompt sort options
    openSortOptionsModal() {
      let alert = this.alertCtrl.create();
      alert.setTitle('Sort By');

      alert.addInput({
        type: 'radio',
        label: 'First Name',
        value: 'firstname',
        checked: this.bSortByFirstName
      });
      alert.addInput({
        type: 'radio',
        label: 'Last Name',
        value: 'lastname',
        checked: this.bSortByLastName
      });
      alert.addInput({
        type: 'radio',
        label: 'Created Date',
        value: 'created_date',
        checked: this.bSortByCreatedDate
      });
      alert.addInput({
        type: 'radio',
        label: 'Modifed Date',
        value: 'modified_date',
        checked: this.bSortByModifedDate
      });

      alert.addButton('Cancel');
      alert.addButton({
        text: 'OK',
        handler: data => {
          //console.log(data);
          this.bSortByFirstName = "firstname" === data;
          this.bSortByLastName = "lastname" === data;
          this.bSortByCreatedDate = "created_date" === data;
          this.bSortByModifedDate = "modified_date" === data;

          if(this.bSortByCreatedDate) {
            this.reloadContacts('', SORTED_FIELDS.ContactCreatedDate);
          }

          if(this.bSortByModifedDate){
            this.reloadContacts('', SORTED_FIELDS.ContactModifiedDate);
          }

          if(this.bSortByFirstName){
            this.reloadContacts('', SORTED_FIELDS.ContactFirstName);
          }

          if(this.bSortByLastName){
            this.reloadContacts('', SORTED_FIELDS.ContactLastName);
          }
        }
      });
      alert.present();
    }

    refreshServer(searchKeyword: string) {
      let sortedField = SORTED_FIELDS.ContactModifiedDate;
      if(this.bSortByCreatedDate)
        sortedField = SORTED_FIELDS.ContactCreatedDate;
      else if(this.bSortByFirstName)
        sortedField = SORTED_FIELDS.ContactFirstName;
      else if(this.bSortByLastName)
        sortedField = SORTED_FIELDS.ContactLastName;

      let loader = super.createLoading();
      loader.present().then(
        () => {
          return this.userService.getCurrentUserSessionId().then(
            userSessionDto => {
              this.dataSyncService.syncContactModuleData(userSessionDto, this.storage).then(
                    syncData => {
                      this.loadContacts('','').then(
                        () => loader.dismissAll()
                      ).catch(super.showConsoleError);
                    }
                  ).catch(super.showConsoleError);
              }
          );
        }
      );
    }

    // prompt search options & perform search with keyword on name fields
    openSearchContactsModal() {
      let alert = this.alertCtrl.create({
        title: 'Search',
        inputs: [
          {
            name: 'keyword',
            placeholder: 'Search keyword'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: data => {
              console.log('Cancel clicked');
            }
          },
          {
            text: 'Search',
            handler: data => {
              console.log('search clicked');
              let sortedField = SORTED_FIELDS.ContactModifiedDate;
              if(this.bSortByCreatedDate)
                sortedField = SORTED_FIELDS.ContactCreatedDate;
              else if(this.bSortByFirstName)
                sortedField = SORTED_FIELDS.ContactFirstName;
              else if(this.bSortByLastName)
                sortedField = SORTED_FIELDS.ContactLastName;

              this.reloadContacts(data.keyword, sortedField);
            }
          }
        ]
      });
      alert.present();
    }

    searchContacts(ev) {
      //this.searchContactsFromStorage(ev.target.value || '');
      this.searchContactsFromServer(ev.target.value || '');
    }

    private searchContactsFromServer(keyword: string) {
      this.userService.getCurrentUserSessionId().then(
        userSession => {
          let searchCommand = new SearchContactCommand();
          searchCommand.keyword = keyword;
          searchCommand.pageNumber = 0;
          searchCommand.appBaseUrl = userSession.appBaseUrl;
          searchCommand.sessionId = userSession.session;
          this.contactService.searchContacts(searchCommand)
            .subscribe(
              searchRes => this.contacts = searchRes,
              super.showConsoleError
            );
        }
      );
    }

    private searchContactsFromStorage(keyword: string) {
      let searchCommand = new KeywordSearchCommand();
      searchCommand.keyword = keyword;
      this.contactService.searchContactsFromStorage(searchCommand).then(
        searchRes => this.contacts = searchRes
      ).catch(super.showConsoleError);
    }

    // cancel search on search bar
    cancelSearch(ev) {
      console.log(ev);
    }

    viewContactDetail(contactDetail : ContactDto) {
      this.navCtrl.push(ViewContactDetailPage, { contactId: contactDetail.id});
    }

    editContactDetail(contactDetail : ContactDto) {
      this.navCtrl.push(EditContactDetailPage, { contactId: contactDetail.id});
    }

    deleteContact(contactDetail : ContactDto) {
      let deletedIdx = this.contacts.findIndex((item) => item.fullName === contactDetail.fullName);
      if(deletedIdx > -1) {
        this.contacts.splice(deletedIdx, 1);
      }
      this.contactService.deleteContact(this.userSessionDto, contactDetail.id);
    }

    // go to add contact page
    addContact() {
      this.navCtrl.push(EditContactDetailPage, { contactId: "0"});
    }

    viewRelatedModules(contactDetail : ContactDto) {
      const oppModal = this.modalCtrl.create(PotentialListModalPage, {recordId: contactDetail.id, contactName: contactDetail.fullName || contactDetail.name });
      oppModal.present();
    }

    callPerson(dto: ContactDto) {
      // console.log('make call ', dto.contact_id);

      if(!this.callNumber.isCallSupported()) {
        super.showUIError('Không thể thực hiện cuộc gọi. Có thể do quyền truy cập chưa đủ.');
        return;
      }
      let phoneNo = dto.phoneNumber || dto.homePhone;
      if(phoneNo){
        this.callNumber.callNumber(phoneNo, true)
          .then(res => console.log('Launched dialer!', res))
          .catch(err => console.log('Error launching dialer', err));
      }
    }

}
