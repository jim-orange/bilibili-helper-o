/**
 * Author: Ruo
 * Create: 2018/9/4
 * Description:
 */
import _ from 'lodash';
import {
    getOption,
    isLogin,
    PERMISSION_STATUS,
    PERMISSION_TYPE,
} from 'Utils';

const {login, notifications} = PERMISSION_TYPE;

/**
 * 特性
 * 规范启用一个特性/功能需要涉及到的一系列方法
 */
export class Feature {
    static defaultOptions = {};

    static features = {};

    get options() {
        return Feature.defaultOptions[this.name];
    }

    set options(options) {
        Feature.defaultOptions[this.name] = options;
    }

    /**
     * @param name {string} 配置的名称
     * @param kind {string} 配置的列表划分，在渲染设置页面时根据该值在相对应的列表中自动渲染，如：主站，直播，其他等
     * @param GUI {ReactDOM}
     * @param optionDOM {ReactDOM}
     * @param options {object} 特性的额外配置选项，如过滤列表的配置信息
     */
    constructor({name, kind, GUI = null, optionDOM = null, permissions = {}, options = {}}) {
        this.name = name;
        this.kind = kind;
        this.GUI = GUI; // 功能/特性的UI
        this.optionDOM = optionDOM; // 设置页面的UI
        this.permissions = permissions;
        this.options = options;
        this.init(() => this.install(this));
    }

    /**
     * 初始化 - 位于装载过程之前
     * 1.检查(启动)配置
     * 2.鉴权
     * @return {Boolean|String} true 表示初始化成功 返回字符串表示初始化失败说明
     */
    init = async (callback = () => {}) => {
        const {on = false} = this.options;
        if (on === false) { // 检查启用状态，如果没有启动则不会执行后续的装载和启动过程
            console.warn(`Feature ${_.upperFirst(this.name)} OFF`);
            return on;
        } else if (on === true) {
            await this.checkPermission().then(({pass, msg}) => pass ? callback(true) : console.error(msg));
        } else { // 没有启动配置
            console.error(`No options names ${_.upperFirst(this.name)}`);
            return false;
        }
    };

    // 获取状态
    getOption = () => {
        return;
    };

    // 启动 - 装载过程之后
    launch = async () => {
        console.error(`Feature ${_.upperFirst(this.name)}'s launch Function is empty!`);
        return;
    };

    // 渲染特性/功能UI
    render = () => {
        return;
    };

    // 鉴权
    checkPermission = async () => {
        if (!this.permissions) return true; // 没有设置需要检查的权限，则无条件通过
        const permissions = this.permissions; // 需要检查的权限列表
        let [pass, msg] = [true, '']; // 通过状态
        await _.map(permissions, async (permission, permissionType) => {
            if (!permission) { // 未知权限类型
                [pass, msg] = [false, `Undefined permission: ${permissionType}`];
            } else if (permission.check && !permission.value) {// 已经检查过 且 没有检查通过 直接返回之前的检查结果
                [pass, msg] = [permission.value, permission.errorMsg];
            } else { // 权限没有检查过
                switch (permissionType) {
                    case 'login': {
                        await isLogin().then((login) => {
                            pass = login ? true : false;
                            msg = permission.errorMsg;
                        });
                        break;
                    }
                    case 'notifications': {
                        await chrome.notifications.getPermissionLevel((level) => {
                            pass = level === 'granted' ? true : false;
                            msg = permission.errorMsg;
                        });
                        break;
                    }
                }
            }
            if (!pass) return false; // 权限检查没过
            else {
                permission.check = true;
                permission.value = true;
            }
        });
        return {pass, msg};
    };

    /**
     * 装载 - 初始化成功后
     * 不同功能有不同的装载要求和时机
     */
    install = (feature) => {
        Feature.features[feature.name] = feature;
        feature.launch();
    }
}